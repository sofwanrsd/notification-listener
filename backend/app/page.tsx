import Link from 'next/link';

const REPO = 'https://github.com/sofwanrsd/notification-listener';

const features = [
  ['🎯', 'Nominal unik', 'Tiap tagihan diberi kode unik pada harga (Rp50.000 → Rp50.347) sehingga mudah dicocokkan tanpa API bank.'],
  ['📷', 'QRIS statis → dinamis', 'Satu QRIS statis diubah jadi QR dinamis ber-nominal (tag 54 + CRC16 dihitung ulang). Pelanggan tinggal scan.'],
  ['🔔', 'Baca notifikasi', 'Aplikasi Android membaca notifikasi "Rp… diterima" dari DANA — hanya dari aplikasi itu, tidak yang lain.'],
  ['🪝', 'Webhook + rekonsiliasi', 'Saat lunas, web utamamu diberi tahu lewat webhook bertanda tangan HMAC, dengan retry dan endpoint rekonsiliasi.'],
  ['🛡️', 'Self-hosted', 'Berjalan di infrastrukturmu sendiri (Vercel + Neon). Kunci dan data tetap milikmu.'],
  ['📖', 'Open source', 'Lisensi MIT, kode terbuka untuk dipelajari, di-fork, dan dikembangkan.'],
];

const steps = [
  ['Buat tagihan', 'Sistem menambahkan kode unik ke harga.'],
  ['Tampilkan QR', 'QRIS dinamis dibuat dengan nominal terkunci.'],
  ['Pelanggan bayar', 'Scan & bayar persis nominal itu dari e-wallet apa pun.'],
  ['Notif terdengar', 'HP menangkap notifikasi "Rp… diterima" dari DANA.'],
  ['Nominal dicocokkan', 'Server mencocokkan nominal dengan tagihan yang menunggu.'],
  ['Lunas & webhook', 'Tagihan ditandai lunas; web utamamu diberi tahu.'],
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="pill pill-warn">Proyek edukasi · Open source</span>
            <h1 style={{ marginTop: 16 }}>Terima QRIS ke DANA-mu,<br />tanpa API resmi.</h1>
            <p className="lede">
              Notification Listener membaca notifikasi pembayaran di HP, mencocokkannya lewat
              <b> nominal unik</b>, lalu menandai pesanan lunas — otomatis. Dibuat untuk belajar
              cara kerja payment gateway dari nol.
            </p>
            <div className="hero-actions">
              <Link href="/docs" className="btn btn-primary btn-lg">Baca dokumentasi API</Link>
              <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn btn-lg">Lihat di GitHub</a>
            </div>
          </div>

          {/* Signature: struk notif → nominal dengan kode unik ter-highlight */}
          <div className="card card-pad" style={{ background: 'linear-gradient(180deg,#fff,#fbfbff)' }}>
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
              <span className="amount" style={{ fontSize: 22, fontWeight: 600 }}><span className="rp">Rp</span>15.<span className="code">445</span></span>
            </div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>✓ Pesanan #INV-284 lunas</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Angka <span style={{ color: 'var(--brand-2)' }}>445</span> adalah kode unik — penanda pesanan mana yang dibayar.
            </p>
          </div>
        </div>
      </section>

      {/* Educational callout */}
      <section className="container">
        <div className="callout warn">
          <b>Untuk edukasi.</b> Proyek ini dibuat untuk mempelajari cara kerja payment gateway dan
          notification listener di Android. Ia memakai akun e-wallet pribadi/bisnis yang dapat melanggar
          Ketentuan Layanan penyedia. Bukan produk resmi, bukan afiliasi DANA. Gunakan atas tanggung jawab sendiri.
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="section">
        <div className="container">
          <span className="eyebrow">Fitur</span>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12, marginBottom: 28 }}>Yang membuatnya bekerja</h2>
          <div className="grid-features">
            {features.map(([ic, title, desc]) => (
              <article className="feature" key={title}>
                <div className="ic">{ic}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="section" style={{ background: 'var(--canvas-2)' }}>
        <div className="container">
          <span className="eyebrow">Cara kerja</span>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12, marginBottom: 28 }}>Dari pesanan sampai lunas</h2>
          <ol className="grid-steps">
            {steps.map(([title, desc], i) => (
              <li key={title}>
                <div className="n">{String(i + 1).padStart(2, '0')}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Security & honesty */}
      <section id="keamanan" className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: 'clamp(24px,4vw,48px)', alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Keamanan &amp; kejujuran</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12 }}>Apa yang perlu kamu tahu</h2>
            <p className="muted" style={{ marginTop: 12 }}>
              Kami menaruh batasan sistem secara terbuka. Gateway tidak pernah menyimpan uangmu —
              pembayaran masuk langsung ke akun DANA-mu.
            </p>
          </div>
          <div className="stack" style={{ ['--gap' as string]: '14px' }}>
            <div className="callout"><b>Endpoint order terlindungi.</b> Pembuatan order butuh kunci merchant (server-ke-server). Halaman ini tidak membuat order publik.</div>
            <div className="callout"><b>Hanya membaca notifikasi DANA.</b> Notifikasi aplikasi lain diabaikan sebelum dibaca. Tidak mengakses saldo atau mengontrol aplikasi apa pun.</div>
            <div className="callout warn"><b>Bersifat best-effort.</b> Jika notifikasi terlewat, pesanan bisa tidak tertandai lunas. Selalu sediakan rekonsiliasi. Untuk kebutuhan serius, pakai QRIS Merchant resmi.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="container center">
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,30px)' }}>Pelajari selengkapnya</h2>
          <p className="muted" style={{ marginTop: 8 }}>Semua endpoint, format webhook, dan panduan integrasi tersedia di dokumentasi.</p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Link href="/docs" className="btn btn-primary btn-lg">Dokumentasi API</Link>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn btn-lg">Kode sumber</a>
          </div>
        </div>
      </section>
    </main>
  );
}
