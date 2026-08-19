import { getOrder } from '@/lib/orders';
import { generateDynamicQR, generateQrPng } from '@/lib/qris';
import PayStatus from './PayStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function rupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <main style={{ textAlign: 'center', paddingTop: 40 }}>
        <h1>Order tidak ditemukan</h1>
      </main>
    );
  }

  let qrImage: string | null = null;
  const staticQris = process.env.QRIS_STATIC;
  if (staticQris && order.status === 'PENDING') {
    try {
      qrImage = await generateQrPng(generateDynamicQR(staticQris, order.amount));
    } catch {
      qrImage = null;
    }
  }

  return (
    <main style={{ textAlign: 'center' }}>
      <h1 style={{ marginBottom: 4 }}>Pembayaran QRIS</h1>
      {order.note && <p style={{ color: '#666', marginTop: 0 }}>{order.note}</p>}

      <div style={{ fontSize: 32, fontWeight: 700, margin: '12px 0' }}>{rupiah(order.amount)}</div>
      <p style={{ color: '#888', marginTop: -8, fontSize: 13 }}>
        Bayar <b>persis</b> nominal di atas (termasuk kode unik {order.unique_code}).
      </p>

      <PayStatus
        orderId={order.id}
        initialStatus={order.status}
        expiresAt={order.expires_at}
        qrImage={qrImage}
      />
    </main>
  );
}
