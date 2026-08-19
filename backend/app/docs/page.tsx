import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dokumentasi API' };

function Method({ m }: { m: 'GET' | 'POST' }) {
  return <span className={`method ${m.toLowerCase()}`}>{m}</span>;
}

function Endpoint({
  id,
  method,
  path,
  children,
}: {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card card-pad" style={{ scrollMarginTop: 84 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Method m={method} />
        <code className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{path}</code>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

const nav = [
  ['ikhtisar', 'Ikhtisar'],
  ['auth', 'Autentikasi'],
  ['create', 'Buat order'],
  ['status', 'Cek status'],
  ['list', 'Daftar order'],
  ['replay', 'Kirim ulang webhook'],
  ['notif', 'Terima notifikasi'],
  ['webhook', 'Webhook'],
];

export default function DocsPage() {
  return (
    <main className="container docs-main" style={{ padding: '40px 0 0', display: 'grid', gridTemplateColumns: '210px minmax(0,1fr)', gap: 44, alignItems: 'start' }}>
      <aside className="docs-nav">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Referensi API</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="docs-link">{label}</a>
          ))}
        </nav>
      </aside>

      <div className="stack" style={{ ['--gap' as string]: '20px' }}>
        <section id="ikhtisar" style={{ scrollMarginTop: 84 }}>
          <span className="eyebrow">Dokumentasi</span>
          <h1 style={{ fontSize: 36, marginTop: 12 }}>API Notification Listener</h1>
          <p className="muted" style={{ fontSize: 17, maxWidth: 620, marginTop: 12 }}>
            Gateway berdiri sendiri (headless). Web utamamu memanggilnya lewat HTTP, mirip memakai
            Midtrans atau Xendit tapi milik sendiri. Semua request dan response memakai <code className="inline">application/json</code>.
          </p>
          <div className="code-block" style={{ marginTop: 18 }}>
            <span className="muted">Base URL</span>{'\n'}https://notification-listener-omega.vercel.app
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
            Provider yang didukung saat ini: <b>DANA</b> (<code className="inline">dana_bisnis</code>).
          </p>
        </section>

        <section id="auth" className="card card-pad" style={{ scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: 20 }}>Autentikasi</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Endpoint order dilindungi <b>opsional</b> lewat env <code className="inline">MERCHANT_API_KEY</code> di gateway.
            Bila diset, sertakan header berikut pada setiap request order:
          </p>
          <div className="code-block">X-Merchant-Key: <span className="s">&lt;MERCHANT_API_KEY&gt;</span></div>
          <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}>
            Endpoint <code className="inline">POST /api/notif</code> (khusus aplikasi HP) dilindungi terpisah lewat header
            <code className="inline">X-API-Key</code> = <code className="inline">LISTENER_API_KEY</code>.
          </p>
        </section>

        <Endpoint id="create" method="POST" path="/api/orders">
          <p className="muted">Buat order baru. Sistem menambahkan kode unik (1 sampai 500) ke harga, membuat QRIS dinamis, dan mengembalikan QR siap tampil. Order kedaluwarsa dalam <b>10 menit</b>.</p>
          <table className="tbl">
            <thead><tr><th>Field</th><th>Tipe</th><th>Keterangan</th></tr></thead>
            <tbody>
              <tr><td>amount</td><td>number</td><td>Harga dasar (rupiah, bilangan bulat &gt; 0). Wajib.</td></tr>
              <tr><td>note</td><td>string</td><td>Keterangan/nomor invoice. Opsional.</td></tr>
              <tr><td>callbackUrl</td><td>string</td><td>URL webhook saat lunas. Opsional.</td></tr>
              <tr><td>redirectUrl</td><td>string</td><td>Redirect pelanggan setelah bayar. Opsional.</td></tr>
            </tbody>
          </table>
          <div className="code-block">
            <span className="k">POST</span> /api/orders{'\n'}
            {'{'}{'\n'}  <span className="k">"amount"</span>: 50000,{'\n'}  <span className="k">"note"</span>: <span className="s">"Pesanan #INV-123"</span>{'\n'}{'}'}
          </div>
          <div className="code-block">
            <span className="muted">200 OK</span>{'\n'}
            {'{'}{'\n'}  <span className="k">"orderId"</span>: <span className="s">"uuid"</span>,{'\n'}  <span className="k">"amount"</span>: 50347,{'\n'}  <span className="k">"status"</span>: <span className="s">"PENDING"</span>,{'\n'}  <span className="k">"payUrl"</span>: <span className="s">"https://…/pay/uuid"</span>,{'\n'}  <span className="k">"qris"</span>: {'{'} <span className="k">"payload"</span>: <span className="s">"0002…"</span>, <span className="k">"image"</span>: <span className="s">"data:image/png;base64,…"</span> {'}'}{'\n'}{'}'}
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Tampilkan <code className="inline">qris.image</code> ke pelanggan, atau arahkan ke <code className="inline">payUrl</code> (halaman checkout bawaan).</p>
        </Endpoint>

        <Endpoint id="status" method="GET" path="/api/orders/:id">
          <p className="muted">Cek status sebuah order. Cocok untuk polling tiap 3 sampai 5 detik.</p>
          <div className="code-block">
            <span className="muted">200 OK</span>{'\n'}
            {'{'} <span className="k">"orderId"</span>: <span className="s">"uuid"</span>, <span className="k">"amount"</span>: 50347, <span className="k">"status"</span>: <span className="s">"PAID"</span>, <span className="k">"paidAt"</span>: <span className="s">"…"</span> {'}'}
          </div>
          <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}><code className="inline">status</code>: <code className="inline">PENDING</code> · <code className="inline">PAID</code> · <code className="inline">EXPIRED</code>.</p>
        </Endpoint>

        <Endpoint id="list" method="GET" path="/api/orders">
          <p className="muted">Ambil 100 order terakhir untuk rekonsiliasi. Butuh <code className="inline">X-Merchant-Key</code> bila diset.</p>
          <div className="code-block">
            <span className="muted">200 OK</span>{'\n'}
            {'{'} <span className="k">"orders"</span>: [ {'{'} <span className="k">"id"</span>, <span className="k">"amount"</span>, <span className="k">"status"</span>, <span className="k">"paidAt"</span>, <span className="k">"callbackStatus"</span> {'}'} ] {'}'}
          </div>
        </Endpoint>

        <Endpoint id="replay" method="POST" path="/api/orders/:id/replay-webhook">
          <p className="muted">Kirim ulang webhook <code className="inline">order.paid</code> untuk order yang sudah <b>PAID</b> dan punya <code className="inline">callbackUrl</code>, berguna bila web utama sempat down.</p>
          <div className="code-block"><span className="muted">200 OK</span>{'\n'}{'{'} <span className="k">"ok"</span>: true, <span className="k">"callbackStatus"</span>: <span className="s">"SENT"</span> {'}'}</div>
        </Endpoint>

        <Endpoint id="notif" method="POST" path="/api/notif">
          <p className="muted">Dipanggil oleh <b>aplikasi Android</b> saat notifikasi pembayaran masuk. Server mencocokkan <code className="inline">amount</code> dengan order PENDING lalu menandainya lunas. Wajib header <code className="inline">X-API-Key</code>.</p>
          <table className="tbl">
            <thead><tr><th>Field</th><th>Tipe</th><th>Keterangan</th></tr></thead>
            <tbody>
              <tr><td>amount</td><td>number</td><td>Nominal terbaca dari notif. Wajib.</td></tr>
              <tr><td>provider</td><td>string</td><td><code className="inline">dana_bisnis</code>. Opsional.</td></tr>
              <tr><td>transactionId</td><td>string</td><td>ID transaksi untuk dedup. Opsional.</td></tr>
            </tbody>
          </table>
          <div className="code-block">{'{'} <span className="k">"duplicate"</span>: false, <span className="k">"matched"</span>: true, <span className="k">"orderId"</span>: <span className="s">"uuid"</span> {'}'}</div>
        </Endpoint>

        <section id="webhook" className="card card-pad" style={{ scrollMarginTop: 84 }}>
          <h2 style={{ fontSize: 20 }}>Webhook</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Saat order lunas, gateway mengirim <code className="inline">POST</code> ke <code className="inline">callbackUrl</code>-mu (retry hingga 3×),
            ditandatangani HMAC-SHA256 di header <code className="inline">X-Signature</code> memakai <code className="inline">WEBHOOK_SECRET</code>.
          </p>
          <div className="code-block">
            <span className="k">POST</span> https://tokomu.example.com/webhook{'\n'}
            <span className="muted">X-Signature: &lt;hmac-sha256&gt;</span>{'\n'}
            {'{'} <span className="k">"event"</span>: <span className="s">"order.paid"</span>, <span className="k">"orderId"</span>: <span className="s">"uuid"</span>, <span className="k">"amount"</span>: 50347, <span className="k">"status"</span>: <span className="s">"PAID"</span> {'}'}
          </div>
          <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}>
            Verifikasi tanda tangan di sisimu sebelum menandai lunas. Selengkapnya di <code className="inline">docs/INTEGRATION.md</code>.
          </p>
        </section>

        <div style={{ height: 40 }} />
      </div>

      <style>{`
        .docs-nav { position: sticky; top: 84px; }
        .docs-link { padding: 7px 10px; border-radius: 8px; color: var(--text-soft); font-size: 14px; }
        .docs-link:hover { background: var(--brand-wash); color: var(--brand); text-decoration: none; }
        @media (max-width: 820px) {
          main.docs-main { grid-template-columns: 1fr !important; }
          .docs-nav { position: static; display: none; }
        }
      `}</style>
    </main>
  );
}
