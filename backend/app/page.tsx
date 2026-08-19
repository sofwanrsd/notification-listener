'use client';

import { useState } from 'react';

function formatRibuan(n: number): string {
  return n.toLocaleString('id-ID');
}

export default function Home() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buatTagihan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat tagihan');
        return;
      }
      window.location.href = data.payUrl || `/pay/${data.orderId}`;
    } catch {
      setError('Tidak bisa terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="wrap" style={{ padding: '64px 24px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 48, alignItems: 'center' }} className="hero-grid">
          <div>
            <span className="eyebrow">Payment gateway QRIS mandiri</span>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', marginTop: 14 }}>
              Notif masuk.<br />Cocok. Lunas.
            </h1>
            <p style={{ fontSize: 18, color: 'var(--ink-soft)', maxWidth: 460, marginTop: 18 }}>
              Terima pembayaran QRIS langsung ke akun DANA-mu. Sistem mendengarkan notifikasi
              pembayaran, mencocokkannya lewat <b>nominal unik</b>, lalu menandai pesanan lunas — otomatis.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <a href="#buat" className="btn btn-primary">Buat tagihan</a>
              <a href="/docs" className="btn">Lihat dokumentasi API</a>
            </div>
          </div>

          {/* Signature: struk notif → nominal dengan kode unik ter-highlight */}
          <div className="card card-pad" style={{ background: 'linear-gradient(180deg,#fff, #fbfbff)' }}>
            <div className="live" style={{ marginBottom: 14 }}><span className="dot" />Mendengarkan notifikasi</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand-wash)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>🔔</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>DANA · Pembayaran Masuk</div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Rp15.445 diterima DANA Bisnis.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px dashed var(--line-strong)' }}>
              <span className="muted" style={{ fontSize: 13 }}>Nominal cocok</span>
              <span className="amount" style={{ fontSize: 22, fontWeight: 600 }}>
                <span className="rp">Rp</span>15.<span className="code">445</span>
              </span>
            </div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
              ✓ Pesanan #INV-284 lunas
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Angka <span style={{ color: 'var(--brand-2)' }}>445</span> adalah kode unik — penanda pesanan mana yang dibayar.
            </p>
          </div>
        </div>
      </section>

      {/* Buat tagihan */}
      <section id="buat" className="wrap wrap-narrow" style={{ padding: '56px 24px 0' }}>
        <div className="card card-pad">
          <h2 style={{ fontSize: 22 }}>Buat tagihan</h2>
          <p className="muted" style={{ marginTop: 6, marginBottom: 22, fontSize: 14 }}>
            Masukkan harga. Kami tambahkan kode unik dan buatkan QR-nya.
          </p>
          <form onSubmit={buatTagihan}>
            <label className="field">
              <span className="lbl">Harga (Rp)</span>
              <input className="input" type="number" inputMode="numeric" min={1} required
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
            </label>
            <label className="field">
              <span className="lbl">Keterangan · opsional</span>
              <input className="input" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pesanan #INV-123" />
            </label>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Membuat…' : 'Buat & tampilkan QR'}
            </button>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 0 }}>{error}</p>}
          </form>
        </div>
      </section>

      {/* Cara kerja — urutan nyata, jadi penomoran beralasan */}
      <section className="wrap" style={{ padding: '64px 24px 0' }}>
        <span className="eyebrow">Cara kerja</span>
        <h2 style={{ fontSize: 26, marginTop: 12, marginBottom: 28 }}>Dari pesanan sampai lunas</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {[
            ['Buat tagihan', 'Sistem menambahkan kode unik pada harga (mis. Rp50.000 → Rp50.347).'],
            ['Tampilkan QR', 'QRIS dinamis dibuat dengan nominal terkunci. Pelanggan tinggal scan.'],
            ['Pelanggan bayar', 'Membayar persis nominal itu ke QRIS-mu dari e-wallet apa pun.'],
            ['Notif terdengar', 'HP menangkap notifikasi "Rp50.347 diterima" dari aplikasi DANA.'],
            ['Nominal dicocokkan', 'Server mencocokkan nominal dengan tagihan yang menunggu.'],
            ['Lunas & webhook', 'Tagihan ditandai lunas; web utamamu diberi tahu lewat webhook.'],
          ].map(([title, desc], i) => (
            <li key={i} className="card card-pad">
              <div className="mono" style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 13 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 8, fontSize: 16 }}>{title}</div>
              <p className="muted" style={{ fontSize: 14, marginTop: 6, marginBottom: 0 }}>{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <style>{`
        @media (max-width: 820px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </main>
  );
}
