'use client';

import { useEffect, useState } from 'react';

type Status = 'PENDING' | 'PAID' | 'EXPIRED';

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

  // Hitung mundur.
  useEffect(() => {
    if (status !== 'PENDING') return;
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  // Polling status tiap 3 detik selama masih PENDING.
  useEffect(() => {
    if (status !== 'PENDING') return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.status && data.status !== 'PENDING') {
          setStatus(data.status);
          if (data.status === 'PAID' && data.redirectUrl) {
            setTimeout(() => {
              window.location.href = data.redirectUrl;
            }, 2000);
          }
        }
      } catch {
        /* abaikan, coba lagi */
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [orderId, status]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  if (status === 'PAID') {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <h2 style={{ color: '#16a34a' }}>Pembayaran Berhasil</h2>
        <p style={{ color: '#666' }}>Terima kasih! Order kamu sudah lunas.</p>
      </div>
    );
  }

  if (status === 'EXPIRED' || remaining <= 0) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 56 }}>⏰</div>
        <h2 style={{ color: '#dc2626' }}>Waktu Habis</h2>
        <p style={{ color: '#666' }}>Order kedaluwarsa. Silakan buat pesanan baru.</p>
      </div>
    );
  }

  return (
    <div>
      {qrImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrImage}
          alt="QRIS"
          width={280}
          height={280}
          style={{ border: '1px solid #eee', borderRadius: 12 }}
        />
      ) : (
        <p style={{ color: '#dc2626' }}>QR belum tersedia (QRIS_STATIC belum diset).</p>
      )}
      <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
        Selesaikan dalam <b style={{ color: '#111' }}>{mm}:{ss}</b>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: '#aaa' }}>Menunggu pembayaran…</div>
    </div>
  );
}
