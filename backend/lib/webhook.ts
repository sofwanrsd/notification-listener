import { createHmac } from 'node:crypto';

// Jumlah percobaan kirim webhook & jeda antar percobaan (ms).
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Kirim webhook ke web utama (toko online / kasir Anda) saat order lunas.
 * Body ditandatangani HMAC-SHA256 (header X-Signature) memakai WEBHOOK_SECRET,
 * supaya penerima bisa memverifikasi bahwa notifikasi ini asli dari gateway.
 *
 * Tahan-banting: mencoba ulang sampai 3x dengan backoff singkat sebelum menyerah.
 * Selalu await + catch, jadi aman dipakai tanpa memblokir alur utama.
 */
export async function fireWebhook(url: string, payload: Record<string, unknown>): Promise<boolean> {
  const body = JSON.stringify(payload);
  const secret = process.env.WEBHOOK_SECRET ?? '';
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return true;
    } catch {
      // gagal koneksi/timeout → biarkan retry di bawah
    }
    // Backoff linear singkat sebelum percobaan berikutnya (kecuali percobaan terakhir).
    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
  }
  return false;
}
