import { randomUUID, createHash } from 'node:crypto';
import { sql } from './db';
import { fireWebhook } from './webhook';

const EXPIRY_MINUTES = 10;
const CODE_MIN = 100;
const CODE_MAX = 500;

export interface Order {
  id: string;
  base_amount: number;
  unique_code: number;
  amount: number;
  note: string | null;
  provider: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  paid_provider: string | null;
  paid_tx_id: string | null;
  callback_url: string | null;
  redirect_url: string | null;
  callback_status: string | null;
}

export interface CreateOrderInput {
  baseAmount: number;
  note?: string;
  provider?: string;
  callbackUrl?: string;
  redirectUrl?: string;
}

/**
 * Bikin order baru dengan nominal unik (harga dasar + kode 100-500).
 * Unique index di DB menjamin tidak ada 2 order PENDING dengan nominal sama.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { baseAmount, note, provider = 'ANY', callbackUrl, redirectUrl } = input;

  for (let attempt = 0; attempt < 25; attempt++) {
    const code = Math.floor(Math.random() * (CODE_MAX - CODE_MIN + 1)) + CODE_MIN;
    const amount = baseAmount + code;
    const id = randomUUID();
    try {
      const rows = (await sql`
        insert into orders
          (id, base_amount, unique_code, amount, note, provider, callback_url, redirect_url, expires_at)
        values
          (${id}, ${baseAmount}, ${code}, ${amount}, ${note ?? null}, ${provider},
           ${callbackUrl ?? null}, ${redirectUrl ?? null}, now() + make_interval(mins => ${EXPIRY_MINUTES}))
        returning *
      `) as Order[];
      return rows[0];
    } catch (e: unknown) {
      // 23505 = unique_violation → nominal bentrok dengan order PENDING lain, coba kode lain
      if ((e as { code?: string })?.code === '23505') continue;
      throw e;
    }
  }
  throw new Error('Gagal membuat nominal unik; terlalu banyak order aktif dengan harga dasar sama.');
}

/** Ambil order + tandai EXPIRED secara lazy kalau sudah lewat batas waktu. */
export async function getOrder(id: string): Promise<Order | null> {
  const rows = (await sql`select * from orders where id = ${id}`) as Order[];
  const order = rows[0];
  if (!order) return null;
  if (order.status === 'PENDING' && new Date(order.expires_at) < new Date()) {
    await sql`update orders set status = 'EXPIRED' where id = ${id} and status = 'PENDING'`;
    order.status = 'EXPIRED';
  }
  return order;
}

export interface IngestResult {
  duplicate: boolean;
  matched: boolean;
  orderId: string | null;
}

/**
 * Terima 1 notifikasi pembayaran dari HP.
 * - Idempotent: notif yang sama (dedup_key) tidak diproses dua kali.
 * - Matching atomik: cari order PENDING dengan nominal cocok & belum kedaluwarsa,
 *   lalu tandai PAID dalam satu statement (aman dari race condition).
 * - Bila order punya callback_url, kirim webhook ke web utama (toko/kasir Anda).
 */
export async function ingestNotif(params: {
  amount: number;
  provider: string;
  rawText?: string;
  txId?: string;
}): Promise<IngestResult> {
  const { amount, provider, rawText, txId } = params;

  const dedupKey = txId
    ? `tx:${provider}:${txId}`
    : `hash:${createHash('sha256').update(`${provider}|${amount}|${rawText ?? ''}`).digest('hex')}`;

  const existing = (await sql`
    select order_id, matched from payments where dedup_key = ${dedupKey}
  `) as { order_id: string | null; matched: boolean }[];
  if (existing[0]) {
    return { duplicate: true, matched: existing[0].matched, orderId: existing[0].order_id };
  }

  const orders = (await sql`
    update orders
       set status = 'PAID', paid_at = now(), paid_provider = ${provider}, paid_tx_id = ${txId ?? null}
     where id = (
       select id from orders
        where status = 'PENDING'
          and amount = ${amount}
          and expires_at > now()
          and (provider = 'ANY' or provider = ${provider})
        order by created_at asc
        limit 1
     )
    returning *
  `) as Order[];
  const order = orders[0] ?? null;

  try {
    await sql`
      insert into payments (dedup_key, provider, amount, raw_text, order_id, matched)
      values (${dedupKey}, ${provider}, ${amount}, ${rawText ?? null}, ${order?.id ?? null}, ${!!order})
    `;
  } catch (e: unknown) {
    // 23505 = dua notif kembar balapan (dedup_key sama). Perlakukan sebagai duplikat, bukan error.
    if ((e as { code?: string })?.code === '23505') {
      const dup = (await sql`
        select order_id, matched from payments where dedup_key = ${dedupKey}
      `) as { order_id: string | null; matched: boolean }[];
      return { duplicate: true, matched: dup[0]?.matched ?? false, orderId: dup[0]?.order_id ?? null };
    }
    throw e;
  }

  if (order?.callback_url) {
    await notifyMainWeb(order);
  }

  return { duplicate: false, matched: !!order, orderId: order?.id ?? null };
}

/** Kirim webhook "PAID" ke web utama dan catat statusnya. Return true bila terkirim. */
export async function notifyMainWeb(order: Order): Promise<boolean> {
  const ok = await fireWebhook(order.callback_url as string, {
    event: 'order.paid',
    orderId: order.id,
    status: 'PAID',
    baseAmount: order.base_amount,
    amount: order.amount,
    uniqueCode: order.unique_code,
    note: order.note,
    provider: order.paid_provider,
    paidAt: order.paid_at,
  });
  await sql`update orders set callback_status = ${ok ? 'SENT' : 'FAILED'} where id = ${order.id}`;
  return ok;
}

/** Ambil daftar order terbaru (untuk rekonsiliasi/dashboard). */
export async function listOrders(limit = 100): Promise<Order[]> {
  return (await sql`
    select * from orders
     order by created_at desc
     limit ${limit}
  `) as Order[];
}

export interface ReplayResult {
  ok: boolean;
  callbackStatus: string;
}

/**
 * Kirim ulang webhook untuk order yang sudah PAID & punya callback_url.
 * Return null bila order tidak ada; throw error deskriptif bila belum PAID / tanpa callback_url.
 */
export async function replayWebhook(id: string): Promise<ReplayResult | null> {
  const order = await getOrder(id);
  if (!order) return null;
  if (order.status !== 'PAID') {
    throw new Error('Order belum PAID; webhook hanya bisa di-replay untuk order lunas');
  }
  if (!order.callback_url) {
    throw new Error('Order tidak punya callback_url');
  }
  const ok = await notifyMainWeb(order);
  return { ok, callbackStatus: ok ? 'SENT' : 'FAILED' };
}
