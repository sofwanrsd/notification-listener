import Link from 'next/link';
import {
  IconTag, IconQr, IconBell, IconShare, IconShield, IconCode,
  IconArrow, IconCheck, IconGithub, IconBook,
} from './icons';

const REPO = 'https://github.com/sofwanrsd/notification-listener';

const features = [
  [<IconTag key="t" />, 'Nominal unik', 'Tiap tagihan diberi kode unik pada harga, misalnya Rp50.000 menjadi Rp50.347. Cocok tanpa API bank.'],
  [<IconQr key="q" />, 'QRIS statis ke dinamis', 'Satu QRIS statis diubah jadi QR dinamis ber-nominal. Pelanggan cukup scan, tanpa mengetik jumlah.'],
  [<IconBell key="b" />, 'Baca notifikasi', 'Aplikasi Android membaca notifikasi pembayaran dari DANA. Notifikasi aplikasi lain diabaikan.'],
  [<IconShare key="s" />, 'Webhook dan rekonsiliasi', 'Saat lunas, web utamamu diberi tahu lewat webhook bertanda tangan, dengan retry dan endpoint rekonsiliasi.'],
  [<IconShield key="sh" />, 'Self hosted', 'Berjalan di infrastrukturmu sendiri di Vercel dan Neon. Kunci serta data tetap milikmu.'],
  [<IconCode key="c" />, 'Kode terbuka', 'Lisensi MIT. Bebas dipelajari, di-fork, dan dikembangkan.'],
];

const steps = [
  ['Buat tagihan', 'Sistem menambahkan kode unik ke harga.'],
  ['Tampilkan QR', 'QRIS dinamis dibuat dengan nominal terkunci.'],
  ['Pelanggan bayar', 'Scan lalu bayar persis nominal itu dari e-wallet apa pun.'],
  ['Notif terdengar', 'HP menangkap notifikasi pembayaran dari DANA.'],
  ['Nominal dicocokkan', 'Server mencocokkan nominal dengan tagihan yang menunggu.'],
  ['Lunas dan webhook', 'Tagihan ditandai lunas, web utamamu diberi tahu.'],
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Payment gateway QRIS mandiri</span>
            <h1 style={{ marginTop: 16 }}>Terima QRIS ke DANA&#8209;mu,<br />tanpa API resmi.</h1>
            <p className="lede">
              Baca notifikasi pembayaran, cocokkan lewat nominal unik, lalu tandai pesanan lunas
              secara otomatis. Satu QRIS statis, tak terbatas tagihan.
            </p>
            <div className="hero-actions">
              <Link href="/docs" className="btn btn-primary btn-lg"><IconBook size={18} />Dokumentasi API</Link>
              <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn btn-lg"><IconGithub size={18} />GitHub</a>
            </div>
          </div>

          {/* Signature: struk notif ke nominal dengan kode unik ter-highlight */}
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              <IconBell size={15} />Contoh transaksi
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0', marginTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-wash)', color: 'var(--brand)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><IconBell size={18} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>DANA, Pembayaran Masuk</div>
                <div style={{ fontSize: 14, color: 'var(--text-soft)' }}>Rp15.445 diterima DANA Bisnis.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px dashed var(--border-strong)' }}>
              <span className="muted" style={{ fontSize: 13 }}>Nominal cocok</span>
              <span className="amount" style={{ fontSize: 22, fontWeight: 600 }}><span className="rp">Rp</span>15.<span className="code">445</span></span>
            </div>
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
              <IconCheck size={17} />Pesanan INV&#8209;284 lunas
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Angka <span style={{ color: '#93b4ff' }}>445</span> adalah kode unik, penanda pesanan mana yang dibayar.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="section">
        <div className="container">
          <span className="eyebrow">Fitur</span>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12, marginBottom: 'var(--gap)' }}>Yang membuatnya bekerja</h2>
          <div className="grid-features">
            {features.map(([ic, title, desc]) => (
              <article className="feature" key={title as string}>
                <div className="ic">{ic}</div>
                <h3>{title as string}</h3>
                <p>{desc as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="section" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">Cara kerja</span>
          <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12, marginBottom: 'var(--gap)' }}>Dari pesanan sampai lunas</h2>
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

      {/* Security */}
      <section id="keamanan" className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.85fr) minmax(0,1.15fr)', gap: 'var(--hero-gap)', alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Keamanan</span>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', marginTop: 12 }}>Batasan yang jujur</h2>
            <p className="muted" style={{ marginTop: 14 }}>
              Gateway tidak pernah menyimpan uangmu. Pembayaran masuk langsung ke akun DANA-mu.
            </p>
          </div>
          <div className="stack" style={{ ['--stack-gap' as string]: 'var(--gap)' }}>
            <div className="callout"><b>Endpoint order terlindungi.</b> Pembuatan order butuh kunci merchant. Halaman ini tidak membuat order publik.</div>
            <div className="callout"><b>Hanya membaca notifikasi DANA.</b> Notifikasi aplikasi lain diabaikan sebelum dibaca. Tidak mengakses saldo.</div>
            <div className="callout warn"><b>Bersifat best effort.</b> Bila notifikasi terlewat, pesanan bisa tidak tertandai lunas. Sediakan rekonsiliasi. Untuk kebutuhan serius, pakai QRIS Merchant resmi.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="container center">
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,30px)' }}>Pelajari selengkapnya</h2>
          <p className="muted" style={{ marginTop: 10 }}>Semua endpoint, format webhook, dan panduan integrasi ada di dokumentasi.</p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link href="/docs" className="btn btn-primary btn-lg">Dokumentasi API<IconArrow size={18} /></Link>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn btn-lg"><IconGithub size={18} />Kode sumber</a>
          </div>
        </div>
      </section>
    </main>
  );
}
