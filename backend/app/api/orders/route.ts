import { NextRequest, NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/orders';
import { isKnownProvider } from '@/lib/providers';
import { generateDynamicQR, generateQrPng } from '@/lib/qris';
import { checkMerchantAuth } from '@/lib/merchant-auth';

export const runtime = 'nodejs';

// POST /api/orders — bikin order baru + nominal unik
export async function POST(req: NextRequest) {
  // Auth merchant opsional: aktif hanya bila MERCHANT_API_KEY diset (lihat lib/merchant-auth.ts).
  if (!checkMerchantAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const baseAmount = Number(body?.amount);
  if (!Number.isInteger(baseAmount) || baseAmount <= 0) {
    return NextResponse.json({ error: 'amount harus bilangan bulat > 0 (rupiah)' }, { status: 400 });
  }

  const provider = body?.provider ? String(body.provider) : 'ANY';
  if (provider !== 'ANY' && !isKnownProvider(provider)) {
    return NextResponse.json({ error: `provider "${provider}" tidak dikenal` }, { status: 400 });
  }

  const note = body?.note ? String(body.note) : undefined;
  const callbackUrl = body?.callbackUrl ? String(body.callbackUrl) : undefined;
  const redirectUrl = body?.redirectUrl ? String(body.redirectUrl) : undefined;

  try {
    const order = await createOrder({ baseAmount, note, provider, callbackUrl, redirectUrl });

    // Buat QRIS dinamis (nominal = order.amount) dari QRIS statis merchant, bila tersedia.
    let qris: { payload: string; image: string } | null = null;
    let qrisError: string | null = null;
    const staticQris = process.env.QRIS_STATIC;
    if (staticQris) {
      try {
        const payload = generateDynamicQR(staticQris, order.amount);
        const image = await generateQrPng(payload);
        qris = { payload, image };
      } catch (e) {
        qrisError = (e as Error).message;
      }
    } else {
      qrisError = 'QRIS_STATIC belum diset di environment';
    }

    return NextResponse.json(
      {
        orderId: order.id,
        baseAmount: order.base_amount,
        uniqueCode: order.unique_code,
        amount: order.amount,
        provider: order.provider,
        note: order.note,
        status: order.status,
        expiresAt: order.expires_at,
        payUrl: `${req.nextUrl.origin}/pay/${order.id}`, // halaman checkout hosted
        qris,       // { payload, image (data URL PNG) } atau null
        qrisError,  // pesan bila QR gagal dibuat, selain itu null
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

// GET /api/orders — daftar order terbaru (rekonsiliasi). Dilindungi merchant auth (opsional).
export async function GET(req: NextRequest) {
  if (!checkMerchantAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await listOrders(100);
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      amount: o.amount,
      baseAmount: o.base_amount,
      status: o.status,
      provider: o.provider,
      createdAt: o.created_at,
      expiresAt: o.expires_at,
      paidAt: o.paid_at,
      callbackStatus: o.callback_status,
    })),
  });
}
