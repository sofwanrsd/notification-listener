# Notification Listener

> Unofficial QRIS payment gateway, baca notifikasi pembayaran, cocokkan via nominal unik.

![License](https://img.shields.io/badge/license-MIT-blue) ![Tujuan](https://img.shields.io/badge/tujuan-edukasi-orange) ![Stack](https://img.shields.io/badge/Next.js%20%2B%20Kotlin-black)

**Demo & Docs:** https://notification-listener-omega.vercel.app · [Dokumentasi API](https://notification-listener-omega.vercel.app/docs)

Payment gateway sederhana untuk **menerima pembayaran QRIS ke akun DANA Bisnis kamu** tanpa API resmi, dengan cara **membaca notifikasi pembayaran** di HP Android dan mencocokkannya ke order lewat **nominal unik**.

> **Dibuat untuk edukasi.** Repo ini untuk mempelajari cara kerja payment gateway: konversi QRIS
> statis → dinamis (tag 54 + CRC16), pencocokan nominal unik, `NotificationListenerService` di Android,
> webhook bertanda tangan, dan deploy serverless. **Bukan produk siap-produksi.**

Proyek ini khusus **DANA** (package `id.dana`, format notif "Rp<nominal> diterima DANA Bisnis").

> **Disclaimer**
> Proyek ini **tidak berafiliasi** dengan DANA atau penyedia QRIS mana pun.
> Ini adalah alat **unofficial** yang hanya membaca notifikasi di HP kamu sendiri.
> Menggunakan akun e-wallet pribadi sebagai gateway pembayaran dapat melanggar Ketentuan Layanan penyedia dan berisiko akun dibekukan. Gunakan atas risiko sendiri, untuk skala kecil/sementara. Untuk kebutuhan serius, gunakan **QRIS Merchant resmi** melalui PJP berlisensi.

## Cara Kerja

```
1. Sistem kamu bikin order Rp50.000
2. Server generate nominal unik → Rp50.347  (347 = kode unik)
   + ubah QRIS STATIS kamu jadi QRIS DINAMIS ber-nominal Rp50.347
3. Customer scan QR → nominal sudah terisi otomatis, tinggal bayar
4. DANA kasih notifikasi "Rp50.347 diterima DANA Bisnis"
5. App Android membaca notif → kirim nominal ke server
6. Server cocokkan 50347 → order → tandai LUNAS
```

- **QRIS statis → dinamis** → kamu cukup sediakan 1 QRIS statis; sistem menyisipkan nominal unik ke tiap order (tag 54 + CRC16 dihitung ulang). Logika konversi di-port dari [sofwanrsd/qrisin](https://github.com/sofwanrsd/qrisin).
- **Nominal unik** → tiap order punya nominal berbeda, jadi mudah dicocokkan.
- **Expiry 10 menit** → order tak dibayar otomatis batal, kode dilepas.
- **Idempotent** → notif dobel tidak melunasi order dua kali.
- **DANA Bisnis** → membaca notifikasi dari app DANA (package `id.dana`) dengan format "Rp<nominal> diterima DANA Bisnis".
- **Foreground service** → app Android berjalan sebagai foreground service agar tetap hidup di background. Di HP Infinix/Tecno/itel (XOS) aktifkan juga **Autostart** untuk app ini agar service tidak dimatikan sistem.

## Struktur Repo

```
.
├── backend/     # API (Next.js) + database (Neon Postgres) → deploy ke Vercel
├── android/     # App Kotlin: NotificationListenerService
└── docs/        # Dokumentasi (lihat docs/API.md)
```

## Quick Start (Backend)

Prasyarat: **Node.js 20+** dan akun **Neon** gratis (https://neon.com).

```bash
cd backend
npm install

# 1. Siapkan environment
cp .env.example .env
#   lalu isi DATABASE_URL (dari Neon) dan LISTENER_API_KEY (string acak)

# 2. Buat tabel database
npm run db:setup

# 3. Jalankan
npm run dev
# → http://localhost:3000
```

Uji cepat:

```bash
# buat order
# X-Merchant-Key opsional: hanya perlu jika MERCHANT_API_KEY di-set di server
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "X-Merchant-Key: <MERCHANT_API_KEY>" \
  -d '{ "amount": 50000 }'

# simulasikan notif dari HP (pakai amount dari respons di atas)
curl -X POST http://localhost:3000/api/notif \
  -H "Content-Type: application/json" -H "X-API-Key: <LISTENER_API_KEY>" \
  -d '{ "amount": 50347, "provider": "dana" }'
```

Buka halaman:
- `http://localhost:3000`, form buat order (demo/admin)
- `http://localhost:3000/pay/<orderId>`, halaman checkout (QR + hitung mundur + status realtime)

> **Auth order (opsional)**, `POST /api/orders` mendukung header `X-Merchant-Key`.
> Set env `MERCHANT_API_KEY` di server untuk mewajibkan header ini saat membuat order.
> Bila `MERCHANT_API_KEY` kosong, endpoint tetap terbuka (mode demo).

Dokumentasi endpoint lengkap: [`docs/API.md`](docs/API.md).
Menghubungkan ke web utama Anda (toko online / kasir): [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

## Quick Start (Android)

Prasyarat: **JDK 17** dan Android SDK. Gradle wrapper sudah tersedia di repo.

```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Setelah dipasang, beri izin **Notification Access** untuk app, lalu pastikan
**foreground service** berjalan. Di HP Infinix/Tecno/itel (XOS) aktifkan juga
**Autostart** untuk app ini agar service tidak dimatikan sistem.

## Deploy

- **Backend** → Vercel (root directory: `backend`). Env yang perlu diset:
  | Env | Wajib | Fungsi |
  |-----|-------|--------|
  | `DATABASE_URL` | Ya | Koneksi Neon Postgres |
  | `LISTENER_API_KEY` | Ya | Kunci untuk aplikasi HP (`X-API-Key`) |
  | `QRIS_STATIC` | Ya | QRIS statis merchant (string mentah) yang diubah jadi QR dinamis |
  | `WEBHOOK_SECRET` | Ya | Menandatangani webhook (HMAC) |
  | `MERCHANT_API_KEY` | disarankan | Mengunci endpoint order (`X-Merchant-Key`). **Wajib untuk deploy publik.** |
  | `CRON_SECRET` | opsional | Mengamankan cron pembersih expiry |
- **Database** → Neon (bisa langsung, atau lewat Vercel Marketplace > Storage).

## Keamanan

- **Rahasia hanya di env.** `.env`, `NeonCredetial.txt`, `local.properties`, dan file Vercel sudah di-`.gitignore`. Jangan pernah commit kunci, `DATABASE_URL`, atau QRIS mentah.
- **Kunci endpoint order.** Set `MERCHANT_API_KEY` di produksi supaya `POST /api/orders`, `GET /api/orders`, dan replay-webhook butuh header `X-Merchant-Key`. Tanpa ini, siapa pun yang tahu URL bisa membuat & melihat order.
- **HP hanya membaca DANA.** Aplikasi menyaring paket notifikasi lebih dulu; isi notifikasi aplikasi lain tidak pernah dibaca atau dikirim.
- **Verifikasi webhook.** Penerima wajib memeriksa `X-Signature` (HMAC-SHA256 dengan `WEBHOOK_SECRET`) sebelum menandai lunas.
- **Best-effort.** Notifikasi bisa terlewat, sediakan rekonsiliasi lewat `GET /api/orders`. Untuk kebutuhan serius, gunakan QRIS Merchant resmi via PJP berlisensi.

## Kontribusi

Kontribusi terbuka! Lihat [`CONTRIBUTING.md`](CONTRIBUTING.md). Proyek ini sengaja **fokus DANA saja**, perbaikan bug, keandalan, dan dokumentasi sangat diterima. Untuk ide di luar cakupan DANA, buka **Issue** dulu untuk diskusi.

## Lisensi

[MIT](LICENSE), bebas dipakai, fork, dan modifikasi.

Proyek disediakan **apa adanya, untuk tujuan edukasi**, tanpa jaminan apa pun. Penulis tidak bertanggung
jawab atas penyalahgunaan, kehilangan dana, pembekuan akun, atau pelanggaran ketentuan layanan pihak
ketiga. Bukan afiliasi DANA, GoTo, atau penyedia QRIS mana pun.
