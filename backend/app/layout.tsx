import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', display: 'swap' });

export const metadata: Metadata = {
  title: 'Notification Listener — Payment gateway QRIS mandiri',
  description:
    'Terima pembayaran QRIS ke akun DANA-mu sendiri. Dengarkan notifikasi masuk, cocokkan lewat nominal unik, konfirmasi otomatis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <header className="site-header">
          <div className="wrap bar">
            <Link href="/" className="brand">
              <span className="mark">NL</span>
              <span>Notification Listener</span>
            </Link>
            <nav className="nav">
              <Link href="/" className="hide-sm">Beranda</Link>
              <Link href="/docs">Dokumentasi API</Link>
              <span className="live"><span className="dot" />Mendengarkan</span>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="wrap">
            Notification Listener — payment gateway QRIS tidak resmi, self-hosted. Bukan afiliasi DANA.
            Gunakan atas tanggung jawab sendiri. · <Link href="/docs">API</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
