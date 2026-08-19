import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { IconGithub } from './icons';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', display: 'swap' });

const SITE = 'https://notification-listener-omega.vercel.app';
const REPO = 'https://github.com/sofwanrsd/notification-listener';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Notification Listener', template: '%s · Notification Listener' },
  description:
    'Payment gateway QRIS mandiri. Terima pembayaran ke akun DANA-mu dengan membaca notifikasi masuk dan mencocokkannya lewat nominal unik.',
  keywords: ['QRIS', 'payment gateway', 'DANA', 'notification listener', 'nominal unik', 'Indonesia'],
  applicationName: 'Notification Listener',
  authors: [{ name: 'sofwanrsd', url: REPO }],
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE,
    siteName: 'Notification Listener',
    title: 'Notification Listener',
    description: 'Payment gateway QRIS mandiri. Terima QRIS ke DANA-mu lewat notifikasi dan nominal unik.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notification Listener',
    description: 'Payment gateway QRIS mandiri lewat notification listener.',
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: '#0a0b12' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Notification Listener',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Android, Web',
  description: 'Payment gateway QRIS mandiri via notification listener.',
  license: 'https://opensource.org/licenses/MIT',
  codeRepository: REPO,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <header className="site-header">
          <div className="container header-bar">
            <Link href="/" className="brand" aria-label="Notification Listener beranda">
              <span className="mark">NL</span>
              <span className="brand-name">Notification Listener</span>
            </Link>
            <nav className="header-nav" aria-label="Navigasi utama">
              <Link href="/#fitur" className="nav-hide-sm">Fitur</Link>
              <Link href="/#cara-kerja" className="nav-hide-sm">Cara kerja</Link>
              <Link href="/docs">Dokumentasi</Link>
              <a href={REPO} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><IconGithub size={19} /></a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="container">
            <div className="footer-top">
              <div className="footer-col footer-about">
                <Link href="/" className="brand"><span className="mark">NL</span><span>Notification Listener</span></Link>
                <p>Payment gateway QRIS mandiri yang membaca notifikasi pembayaran dan mencocokkannya lewat nominal unik.</p>
              </div>
              <div className="footer-col">
                <h5>Produk</h5>
                <Link href="/#fitur">Fitur</Link>
                <Link href="/#cara-kerja">Cara kerja</Link>
                <Link href="/#keamanan">Keamanan</Link>
              </div>
              <div className="footer-col">
                <h5>Dokumentasi</h5>
                <Link href="/docs">Referensi API</Link>
                <a href={`${REPO}/blob/main/docs/INTEGRATION.md`} target="_blank" rel="noopener noreferrer">Integrasi</a>
                <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">Kontribusi</a>
              </div>
              <div className="footer-col">
                <h5>Sumber</h5>
                <a href={REPO} target="_blank" rel="noopener noreferrer">Repositori GitHub</a>
                <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">Lisensi MIT</a>
                <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Laporkan isu</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 Notification Listener. Lisensi MIT.</span>
              <span>Alat tidak resmi. Bukan afiliasi DANA atau penyedia QRIS.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
