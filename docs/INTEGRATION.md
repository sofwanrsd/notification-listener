# Panduan Integrasi — Menghubungkan Web Utama (mis. web utama Anda)

Gateway ini berdiri sendiri (headless). Web utama kamu memakainya lewat HTTP API,
mirip memakai Midtrans/Xendit tapi milik sendiri.

Base URL gateway: `https://<gateway>.vercel.app`

Ada 2 cara integrasi. Boleh dipakai bersamaan (webhook + polling sebagai cadangan).

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

> Webhook bersifat best-effort (1x kirim). Jadikan **polling (Opsi B)** sebagai jaring pengaman.

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

## Catatan penting

- **Idempotensi di sisi web utama**: webhook/polling bisa terjadi >1x untuk order sama. Pastikan menandai lunas hanya sekali (cek status invoice sebelum update).
- **Kaitkan order** lewat `orderId` (atau taruh nomor invoice di `note`).
- **Expiry 10 menit**: order tak dibayar otomatis `EXPIRED`.
- **Keamanan**: `WEBHOOK_SECRET` hanya di server gateway & server web utama — jangan di frontend.
