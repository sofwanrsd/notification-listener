// Auth opsional untuk endpoint merchant (buat order, list, replay webhook).
// Bila env MERCHANT_API_KEY diset, request WAJIB membawa header x-merchant-key
// yang cocok. Bila tidak diset (dev/demo lokal), request diizinkan tanpa key.

import type { NextRequest } from 'next/server';

/** true = boleh lanjut, false = tolak dengan 401. */
export function checkMerchantAuth(req: NextRequest): boolean {
  const expected = process.env.MERCHANT_API_KEY;
  if (!expected) return true; // tidak diset → auth non-aktif (dev/demo)
  return req.headers.get('x-merchant-key') === expected;
}
