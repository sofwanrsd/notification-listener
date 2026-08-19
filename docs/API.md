# API Reference

Base URL (lokal): `http://localhost:3000`
Base URL (produksi): `https://<project>.vercel.app`

Semua request/response memakai `Content-Type: application/json`.

Ada 2 kelompok endpoint:

- **Merchant / internal kamu**, dipakai sistem order/kasir kamu (`/api/orders`, `/api/orders/:id`, rekonsiliasi). Bisa dilindungi merchant key.
- **Khusus HP**, dipakai aplikasi Android listener (`/api/notif`). Dilindungi API key.

> **Provider:** saat ini gateway **hanya** mendukung **DANA** (`dana_bisnis`). Nilai `provider` lain akan ditolak `400`.

---

## Auth Merchant (opsional)

Endpoint order (`POST /api/orders`, `GET /api/orders`, `POST /api/orders/:id/replay-webhook`)
dilindungi **opsional** lewat env `MERCHANT_API_KEY`:

- Bila `MERCHANT_API_KEY` **diset**, request WAJIB membawa header `X-Merchant-Key: <nilai ini>`. Jika tidak cocok → `401`.
- Bila **kosong/tidak diset**, endpoint terbuka tanpa auth (praktis untuk development/demo lokal).

---

## 1. Buat Order

Membuat order baru dan meng-generate **nominal unik** (harga dasar + kode 100 sampai 500).
Order otomatis kedaluwarsa dalam **10 menit** kalau belum dibayar.

```
POST /api/orders
Header: X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset
```

**Request body**

| Field         | Tipe   | Wajib | Keterangan |
|---------------|--------|-------|------------|
| `amount`      | number | Ya    | Harga dasar dalam rupiah (bilangan bulat > 0) |
| `note`        | string | Tidak | Keterangan order (mis. "Order #123 - Kopi") |
| `provider`    | string | Tidak | `dana_bisnis` atau `ANY` (default). DANA satu-satunya provider yang didukung. |
| `callbackUrl` | string | Tidak | URL webhook web utama; dipanggil saat order LUNAS (lihat `INTEGRATION.md`) |
| `redirectUrl` | string | Tidak | URL tujuan redirect customer setelah bayar (dipakai halaman `/pay`) |

**Contoh**

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{ "amount": 50000, "note": "Order #123" }'
```

**Response `201`**

```json
{
  "orderId": "b1e2...-uuid",
  "baseAmount": 50000,
  "uniqueCode": 347,
  "amount": 50347,
  "provider": "ANY",
  "note": "Order #123",
  "status": "PENDING",
  "expiresAt": "2026-08-20T10:10:00.000Z",
  "payUrl": "https://<gateway>/pay/b1e2...-uuid",
  "qris": {
    "payload": "00020101021226...5405503475802ID...XXXX",
    "image": "data:image/png;base64,iVBORw0KGgo..."
  },
  "qrisError": null
}
```

`payUrl` = halaman checkout hosted (QR + hitung mundur + status realtime). Web utama boleh redirect customer ke sana, atau menampilkan `qris.image` sendiri.

Tampilkan **`qris.image`** (gambar QR dinamis) ke customer, nominalnya sudah terkunci ke `amount`, jadi customer tinggal scan tanpa mengetik jumlah.

| Field       | Keterangan |
|-------------|------------|
| `qris.payload` | String QRIS dinamis (EMV) hasil konversi dari QRIS statis + nominal unik |
| `qris.image`   | Data URL PNG QR siap `<img src="...">` |
| `qrisError`    | Berisi pesan bila QR gagal dibuat (mis. `QRIS_STATIC` belum diset); selain itu `null` |

> QR dinamis dibuat dari env **`QRIS_STATIC`** (QRIS statis merchant). Bila belum diset, `qris` = `null` dan order tetap dibuat (customer bayar manual sesuai `amount`).

**Error**
- `401`, `X-Merchant-Key` salah / tidak ada (hanya bila `MERCHANT_API_KEY` diset).
- `400`, `amount` tidak valid / `provider` tidak dikenal.
- `409`, gagal membuat nominal unik (terlalu banyak order aktif dengan harga dasar sama).

---

## 2. Cek Status Order

```
GET /api/orders/:id
```

**Contoh**

```bash
curl http://localhost:3000/api/orders/b1e2...-uuid
```

**Response `200`**

```json
{
  "orderId": "b1e2...-uuid",
  "baseAmount": 50000,
  "amount": 50347,
  "provider": "ANY",
  "note": "Order #123",
  "status": "PAID",
  "expiresAt": "2026-08-20T10:10:00.000Z",
  "paidAt": "2026-08-20T10:03:12.000Z",
  "paidProvider": "dana_bisnis"
}
```

`status` bernilai salah satu: `PENDING` | `PAID` | `EXPIRED`.
Status di-refresh otomatis (order PENDING yang lewat waktu jadi `EXPIRED` saat dibaca).

> **Tips polling:** frontend cukup polling endpoint ini tiap 3 sampai 5 detik sampai `status` jadi `PAID` atau `EXPIRED`.

**Error**
- `404`, order tidak ditemukan.

---

## 3. Daftar Order (rekonsiliasi)

Ambil hingga **100 order terakhir**, diurutkan `created_at` menurun. Berguna untuk dashboard/rekonsiliasi.

```
GET /api/orders
Header: X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset
```

**Contoh**

```bash
curl http://localhost:3000/api/orders \
  -H "X-Merchant-Key: rahasia-merchant"
```

**Response `200`**

```json
{
  "orders": [
    {
      "id": "b1e2...-uuid",
      "amount": 50347,
      "baseAmount": 50000,
      "status": "PAID",
      "provider": "ANY",
      "createdAt": "2026-08-20T10:00:00.000Z",
      "expiresAt": "2026-08-20T10:10:00.000Z",
      "paidAt": "2026-08-20T10:03:12.000Z",
      "callbackStatus": "SENT"
    }
  ]
}
```

`callbackStatus`: `SENT` | `FAILED` | `null` (belum ada callback / belum lunas).

**Error**
- `401`, `X-Merchant-Key` salah / tidak ada (hanya bila `MERCHANT_API_KEY` diset).

---

## 4. Kirim Ulang Webhook (replay)

Kirim ulang webhook `order.paid` untuk order yang sudah **PAID** dan punya `callbackUrl`.
Berguna bila web utama sempat down saat webhook pertama dikirim.

```
POST /api/orders/:id/replay-webhook
Header: X-Merchant-Key: <MERCHANT_API_KEY>   # wajib bila MERCHANT_API_KEY diset
```

**Contoh**

```bash
curl -X POST http://localhost:3000/api/orders/b1e2...-uuid/replay-webhook \
  -H "X-Merchant-Key: rahasia-merchant"
```

**Response `200`**

```json
{ "ok": true, "callbackStatus": "SENT" }
```

`callbackStatus` juga di-update di DB (`SENT` / `FAILED`).

**Error**
- `401`, `X-Merchant-Key` salah / tidak ada (hanya bila `MERCHANT_API_KEY` diset).
- `404`, order tidak ditemukan.
- `400`, order belum `PAID`, atau tidak punya `callbackUrl`.

---

## 5. Kirim Notifikasi (khusus HP)

Dipanggil oleh **aplikasi Android** setiap kali ada notif pembayaran masuk.
Server akan mencocokkan `amount` dengan order `PENDING` dan menandainya `PAID`.

```
POST /api/notif
Header: X-API-Key: <LISTENER_API_KEY>
```

**Request body**

| Field           | Tipe   | Wajib | Keterangan |
|-----------------|--------|-------|------------|
| `amount`        | number | Ya    | Nominal yang terbaca dari notif (bilangan bulat) |
| `provider`      | string | Tidak | `dana_bisnis` (asal notif) |
| `rawText`       | string | Tidak | Teks mentah notif (buat audit/debug) |
| `transactionId` | string | Tidak | ID transaksi bila ada (untuk dedup lebih akurat) |

**Contoh**

```bash
curl -X POST http://localhost:3000/api/notif \
  -H "Content-Type: application/json" \
  -H "X-API-Key: rahasia-panjang" \
  -d '{ "amount": 50347, "provider": "dana_bisnis", "rawText": "Kamu menerima Rp50.347" }'
```

**Response `200`**

```json
{ "duplicate": false, "matched": true, "orderId": "b1e2...-uuid" }
```

| Field       | Arti |
|-------------|------|
| `matched`   | `true` bila nominal cocok dengan sebuah order PENDING |
| `duplicate` | `true` bila notif ini sudah pernah diproses (idempotent) |
| `orderId`   | ID order yang dilunasi, atau `null` bila tak ada yang cocok |

**Error**
- `401`, `X-API-Key` salah / tidak ada.
- `400`, `amount` tidak valid.

> **Idempotency:** notif dianggap duplikat berdasarkan `transactionId` (bila ada) atau hash dari `provider + amount + rawText`. Notif dobel tidak akan melunasi order dua kali.

---

## Catatan Keamanan

- `LISTENER_API_KEY` **wajib** dirahasiakan, hanya ada di server (env) dan di HP kamu.
- `MERCHANT_API_KEY` (bila dipakai) hanya di server gateway & server web utama, jangan taruh di frontend/browser.
- Jangan pernah menaruh logika keuangan penting hanya di HP; server adalah sumber kebenaran (source of truth).
- Semua endpoint sebaiknya diakses lewat HTTPS (otomatis di Vercel).
