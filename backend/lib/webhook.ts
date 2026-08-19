import { createHmac } from 'node:crypto';

/**
 * Kirim webhook ke web utama (toko online / kasir Anda) saat order lunas.
 * Body ditandatangani HMAC-SHA256 (header X-Signature) memakai WEBHOOK_SECRET,
 * supaya penerima bisa memverifikasi bahwa notifikasi ini asli dari gateway.
 */
export async function fireWebhook(url: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const secret = process.env.WEBHOOK_SECRET ?? '';
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
