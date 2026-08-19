'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconClock } from '../../icons';

type Status = 'PENDING' | 'PAID' | 'EXPIRED';
const TOTAL_SECONDS = 10 * 60;

export default function PayStatus({
  orderId,
  initialStatus,
  expiresAt,
  qrImage,
}: {
  orderId: string;
  initialStatus: Status;
  expiresAt: string;
  qrImage: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (status !== 'PENDING') return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status !== 'PENDING') return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.status && data.status !== 'PENDING') {
          setStatus(data.status);
          if (data.status === 'PAID' && data.redirectUrl) {
            setTimeout(() => (window.location.href = data.redirectUrl), 2200);
          }
        }
      } catch {
        /* diam, coba lagi */
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [orderId, status]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = Math.max(0, Math.min(100, (remaining / TOTAL_SECONDS) * 100));

  // Divider "struk" berlubang di kedua sisi
  const perforation = (
    <div style={{ position: 'relative', height: 1, background: 'transparent', borderTop: '2px dashed var(--border-strong)' }}>
      <span style={{ position: 'absolute', left: -12, top: -11, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg)' }} />
      <span style={{ position: 'absolute', right: -12, top: -11, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg)' }} />
    </div>
  );

  if (status === 'PAID') {
    return (
      <>
        {perforation}
        <div className="card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><IconCheck size={32} /></div>
          <h2 style={{ fontSize: 22, color: 'var(--success)' }}>Pembayaran berhasil</h2>
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>Terima kasih! Pesananmu sudah lunas.</p>
        </div>
      </>
    );
  }

  if (status === 'EXPIRED' || remaining <= 0) {
    return (
      <>
        {perforation}
        <div className="card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--muted)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><IconClock size={30} /></div>
          <h2 style={{ fontSize: 22 }}>Waktu pembayaran habis</h2>
          <p className="muted" style={{ marginTop: 8 }}>Tagihan ini kedaluwarsa. Buat tagihan baru untuk mencoba lagi.</p>
          <a href="/" className="btn" style={{ marginTop: 8 }}>Buat tagihan baru</a>
        </div>
      </>
    );
  }

  return (
    <>
      {perforation}
      <div className="card-pad" style={{ textAlign: 'center', paddingTop: 26 }}>
        {qrImage ? (
          <div style={{ display: 'inline-block', padding: 14, background: '#fff', border: '1px solid var(--border)', borderRadius: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="Kode QRIS untuk pembayaran" width={230} height={230} style={{ display: 'block' }} />
          </div>
        ) : (
          <p style={{ color: 'var(--danger)' }}>QR belum tersedia (QRIS_STATIC belum diatur).</p>
        )}

        <div style={{ marginTop: 22 }}>
          <div className="live" style={{ justifyContent: 'center' }}><span className="dot" />Menunggu pembayaran</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 600, marginTop: 8, letterSpacing: '0.04em' }}>{mm}:{ss}</div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-grad)', borderRadius: 999, transition: 'width 1s linear' }} />
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
            Scan dengan aplikasi apa pun yang mendukung QRIS. Halaman ini memperbarui sendiri saat pembayaran masuk.
          </p>
        </div>
      </div>
    </>
  );
}
