import { NextRequest, NextResponse } from 'next/server';
import { ingestNotif } from '@/lib/orders';

export const runtime = 'nodejs';

// POST /api/notif — dipanggil oleh HP (Android listener) saat ada notif pembayaran masuk.
// Wajib menyertakan header: X-API-Key: <LISTENER_API_KEY>
export async function POST(req: NextRequest) {
  const key = req.headers.get('x-api-key');
  if (!process.env.LISTENER_API_KEY || key !== process.env.LISTENER_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount wajib bilangan bulat > 0' }, { status: 400 });
  }

  const provider = body?.provider ? String(body.provider) : 'unknown';
  const rawText = body?.rawText ? String(body.rawText) : undefined;
  const txId = body?.transactionId ? String(body.transactionId) : undefined;

  const result = await ingestNotif({ amount, provider, rawText, txId });
  return NextResponse.json(result);
}
