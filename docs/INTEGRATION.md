# Panduan Integrasi — Menghubungkan Web Utama (mis. web utama Anda)

Gateway ini berdiri sendiri (headless). Web utama kamu memakainya lewat HTTP API,
mirip memakai Midtrans/Xendit tapi milik sendiri.

Base URL gateway: `https://<gateway>.vercel.app`

> **Provider:** gateway saat ini **hanya** mendukung **DANA** (`dana_bisnis`).

Ada 2 cara integrasi. Boleh dipakai bersamaan (webhook + polling sebagai cadangan).

---

## Auth Merchant (opsional)

Endpoint order dilindungi **opsional** lewat env `MERCHANT_API_KEY` di sisi gateway:

- Bila diset, setiap request ke `POST /api/orders`, `GET /api/orders`, dan
  `POST /api/orders/:id/replay-webhook` WAJIB membawa header `X-Merchant-Key: <MERCHANT_API_KEY>`.
- Bila kosong, endpoint terbuka tanpa auth (praktis untuk development/demo lokal).

Simpan `MERCHANT_API_KEY` hanya di server web utama — jangan di frontend/browser.

---

## Alur singkat

```
Web utama (web utama)                Gateway                         Customer
   │  POST /api/orders  ───────────►│                                │
   │  ◄── orderId, amount, payUrl,  │                                │
   │      qris.image                │                                │
   │                                │                                │
   │  redirect / tampilkan QR ──────────────────────────────────────►│ scan & bayar
   │                                │  ◄── notif dari HP (listener)   │
   │                                │  cocokkan nominal → PAID        │
   │  ◄── WEBHOOK order.paid ───────│                                │
   │  (atau polling GET status)     │                                │
```

---

## Opsi A — Webhook (push, direkomendasikan)

### 1. Buat order dari server web utama

```http
POST /api/orders
Content-Type: application/json
X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset

{
  "amount": 50000,
  "note": "Invoice #INV-123",
  "callbackUrl": "https://tokomu.example.com/api/payment/webhook",
  "redirectUrl": "https://tokomu.example.com/order/INV-123/success"
}
```

Respons `201`:

```json
{
  "orderId": "uuid",
  "amount": 50347,
  "uniqueCode": 347,
  "status": "PENDING",
  "expiresAt": "...",
  "payUrl": "https://<gateway>/pay/uuid",
  "qris": { "payload": "0002...", "image": "data:image/png;base64,..." }
}
```

- Tampilkan `qris.image` di halaman web utama, **atau** redirect customer ke `payUrl` (halaman checkout bawaan gateway: QR + hitung mundur + status realtime).
- Simpan `orderId` dan kaitkan dengan invoice web utama (mis. `INV-123`).

### 2. Terima webhook saat lunas

Saat pembayaran cocok, gateway mengirim:

```http
POST https://tokomu.example.com/api/payment/webhook
Content-Type: application/json
X-Signature: <hmac-sha256 hex>

{
  "event": "order.paid",
  "orderId": "uuid",
  "status": "PAID",
  "baseAmount": 50000,
  "amount": 50347,
  "uniqueCode": 347,
  "note": "Invoice #INV-123",
  "provider": "dana_bisnis",
  "paidAt": "..."
}
```

### 3. Verifikasi tanda tangan di web utama (WAJIB)

Hitung HMAC-SHA256 dari **raw body** memakai `WEBHOOK_SECRET` yang sama, bandingkan dengan header `X-Signature`.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

Jika valid → tandai invoice web utama LUNAS. Balas `200 OK`.

> Gateway mencoba mengirim webhook **hingga 3x** dengan backoff singkat sebelum menandai
> `callbackStatus = FAILED`. Meski begitu, tetap jadikan **polling (Opsi B)** sebagai jaring pengaman.
> Bila webhook gagal terkirim, kamu bisa mengirim ulang manual lewat **replay** (lihat di bawah).

---

## Opsi B — Polling (pull, cadangan/sederhana)

Setelah membuat order, web utama cek status berkala:

```http
GET /api/orders/{orderId}
```

```json
{ "orderId": "uuid", "amount": 50347, "status": "PENDING", "expiresAt": "..." }
```

`status`: `PENDING` | `PAID` | `EXPIRED`. Polling tiap 3–5 detik sampai berubah.

---

## Rekonsiliasi & replay webhook

Untuk audit/rekonsiliasi, ambil daftar order terakhir:

```http
GET /api/orders
X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset
```

Mengembalikan hingga 100 order terakhir (`id`, `amount`, `baseAmount`, `status`,
`provider`, `createdAt`, `expiresAt`, `paidAt`, `callbackStatus`).

Bila sebuah order sudah `PAID` tapi `callbackStatus = FAILED` (mis. web utama sempat down),
kirim ulang webhook-nya:

```http
POST /api/orders/{orderId}/replay-webhook
X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset
```

Respons `200`: `{ "ok": true, "callbackStatus": "SENT" }`. Error `400` bila order belum
`PAID` atau tidak punya `callbackUrl`, `404` bila order tidak ditemukan.

---

## Catatan penting

- **Idempotensi di sisi web utama**: webhook/polling bisa terjadi >1x untuk order sama. Pastikan menandai lunas hanya sekali (cek status invoice sebelum update).
- **Kaitkan order** lewat `orderId` (atau taruh nomor invoice di `note`).
- **Expiry 10 menit**: order tak dibayar otomatis `EXPIRED`.
- **Keamanan**: `WEBHOOK_SECRET` hanya di server gateway & server web utama — jangan di frontend.
