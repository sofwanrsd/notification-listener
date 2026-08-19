import { getOrder } from '@/lib/orders';
import { generateDynamicQR, generateQrPng } from '@/lib/qris';
import PayStatus from './PayStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <main className="wrap wrap-narrow" style={{ padding: '90px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26 }}>Tagihan tidak ditemukan</h1>
        <p className="muted" style={{ marginTop: 8 }}>Tautannya mungkin salah atau sudah dihapus.</p>
        <a href="/" className="btn" style={{ marginTop: 20 }}>Kembali</a>
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

  const formatted = order.amount.toLocaleString('id-ID');
  const code = formatted.slice(-3);
  const prefix = formatted.slice(0, -3);

  return (
    <main className="wrap wrap-narrow" style={{ padding: '48px 24px 0' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-pad" style={{ textAlign: 'center', paddingBottom: 20 }}>
          <div className="eyebrow">Pembayaran QRIS</div>
          {order.note && <div style={{ marginTop: 10, color: 'var(--ink-soft)', fontSize: 15 }}>{order.note}</div>}
          <div className="amount" style={{ fontSize: 42, fontWeight: 600, marginTop: 12, letterSpacing: '-0.02em' }}>
            <span className="rp" style={{ fontSize: 24 }}>Rp</span>{prefix}<span className="code">{code}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            Bayar <b>persis</b> nominal ini. Angka <span style={{ color: 'var(--brand-2)' }}>{code}</span> adalah kode unik pesananmu.
          </p>
        </div>

        <PayStatus
          orderId={order.id}
          initialStatus={order.status}
          expiresAt={order.expires_at}
          qrImage={qrImage}
        />
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 16 }}>
        Ditenagai Notification Listener
      </p>
    </main>
  );
}
