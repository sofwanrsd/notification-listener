export const metadata = {
  title: 'Notification Listener',
  description: 'Unofficial QRIS payment gateway via notification listener',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
        {children}
      </body>
    </html>
  );
}
