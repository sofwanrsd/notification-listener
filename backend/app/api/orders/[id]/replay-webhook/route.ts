import { NextRequest, NextResponse } from 'next/server';
import { replayWebhook } from '@/lib/orders';
import { checkMerchantAuth } from '@/lib/merchant-auth';

export const runtime = 'nodejs';

// POST /api/orders/:id/replay-webhook — kirim ulang webhook untuk order PAID.
// Dilindungi merchant auth (opsional, aktif bila MERCHANT_API_KEY diset).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkMerchantAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await replayWebhook(id);
    if (!result) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    // Belum PAID / tanpa callback_url → request tidak valid.
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
