'use client';

import { useState } from 'react';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrder(e: React.FormEvent) {
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
        setError(data.error || 'Gagal membuat order');
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
      <h1>Notification Listener</h1>
      <p style={{ color: '#666' }}>Buat order untuk menghasilkan QRIS dinamis (demo / admin).</p>

      <form onSubmit={createOrder} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
        <label>
          Harga dasar (Rp)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50000"
            required
            min={1}
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </label>
        <label>
          Catatan (opsional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Order #123"
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: 10, fontSize: 16, cursor: 'pointer' }}>
          {loading ? 'Membuat…' : 'Buat & Tampilkan QR'}
        </button>
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      </form>

      <p style={{ marginTop: 24, fontSize: 13, color: '#888' }}>
        Untuk integrasi ke web utama Anda, lihat <code>docs/INTEGRATION.md</code>.
      </p>
    </main>
  );
}
