import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';

export const runtime = 'nodejs';

// GET /api/orders/:id — cek status order (PENDING | PAID | EXPIRED)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json({
    orderId: order.id,
    baseAmount: order.base_amount,
    amount: order.amount,
    provider: order.provider,
    note: order.note,
    status: order.status,
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
    paidProvider: order.paid_provider,
    redirectUrl: order.redirect_url,
  });
}
