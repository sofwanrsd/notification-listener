# Notification Listener

> Unofficial QRIS payment gateway — baca notifikasi pembayaran, cocokkan via nominal unik.

Payment gateway sederhana untuk **menerima pembayaran QRIS ke e-wallet pribadi/bisnis kamu** (DANA, GoPay, dll) tanpa API resmi — dengan cara **membaca notifikasi pembayaran** di HP Android dan mencocokkannya ke order lewat **nominal unik**.

> ⚠️ **Disclaimer**
> Proyek ini **tidak berafiliasi** dengan DANA, GoPay, GoTo, atau penyedia QRIS mana pun.
> Ini adalah alat **unofficial** yang hanya membaca notifikasi di HP kamu sendiri.
> Menggunakan akun e-wallet pribadi sebagai gateway pembayaran dapat melanggar Ketentuan Layanan penyedia dan berisiko akun dibekukan. Gunakan atas risiko sendiri, untuk skala kecil/sementara. Untuk kebutuhan serius, gunakan **QRIS Merchant resmi** melalui PJP berlisensi.

## Cara Kerja

```
1. Sistem kamu bikin order Rp50.000
2. Server generate nominal unik → Rp50.347  (347 = kode unik)
   + ubah QRIS STATIS kamu jadi QRIS DINAMIS ber-nominal Rp50.347
3. Customer scan QR → nominal sudah terisi otomatis, tinggal bayar
4. E-wallet kasih notifikasi "pembayaran masuk Rp50.347"
5. App Android membaca notif → kirim nominal ke server
6. Server cocokkan 50347 → order → tandai LUNAS ✅
```

- **QRIS statis → dinamis** → kamu cukup sediakan 1 QRIS statis; sistem menyisipkan nominal unik ke tiap order (tag 54 + CRC16 dihitung ulang). Logika konversi di-port dari [sofwanrsd/qrisin](https://github.com/sofwanrsd/qrisin).
- **Nominal unik** → tiap order punya nominal berbeda, jadi mudah dicocokkan.
- **Expiry 10 menit** → order tak dibayar otomatis batal, kode dilepas.
- **Idempotent** → notif dobel tidak melunasi order dua kali.
- **Multi-provider (on/off)** → dukung DANA Bisnis, GoPay Merchant, dll; aktifkan satu sebagai backup satu sama lain.

## Struktur Repo

```
.
├── backend/     # API (Next.js) + database (Neon Postgres) → deploy ke Vercel
├── android/     # App Kotlin: NotificationListenerService (menyusul)
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
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -d '{ "amount": 50000 }'

# simulasikan notif dari HP (pakai amount dari respons di atas)
curl -X POST http://localhost:3000/api/notif \
  -H "Content-Type: application/json" -H "X-API-Key: <LISTENER_API_KEY>" \
  -d '{ "amount": 50347, "provider": "dana_bisnis" }'
```

Buka halaman:
- `http://localhost:3000` — form buat order (demo/admin)
- `http://localhost:3000/pay/<orderId>` — halaman checkout (QR + hitung mundur + status realtime)

Dokumentasi endpoint lengkap: [`docs/API.md`](docs/API.md).
Menghubungkan ke web utama Anda (toko online / kasir): [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

## Deploy

- **Backend** → Vercel (root directory: `backend`). Tambahkan env `DATABASE_URL`, `LISTENER_API_KEY`, `CRON_SECRET`.
- **Database** → Neon (bisa langsung, atau lewat Vercel Marketplace > Storage).

## Kontribusi

Kontribusi terbuka! Lihat [`CONTRIBUTING.md`](CONTRIBUTING.md). Menambah provider baru cukup:
1. Tambah entri di `backend/lib/providers.ts`.
2. Buat parser notif di sisi Android.

## Lisensi

[MIT](LICENSE) — bebas dipakai, fork, dan modifikasi.
