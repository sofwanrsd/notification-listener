# API Reference — DANA QRIS Gateway

Base URL (lokal): `http://localhost:3000`
Base URL (produksi): `https://<project>.vercel.app`

Semua request/response memakai `Content-Type: application/json`.

Ada 2 kelompok endpoint:

- **Publik / internal kamu** — dipakai sistem order/kasir kamu (`/api/orders`, `/api/orders/:id`).
- **Khusus HP** — dipakai aplikasi Android listener (`/api/notif`). Dilindungi API key.

---

## 1. Buat Order

Membuat order baru dan meng-generate **nominal unik** (harga dasar + kode 100–999).
Order otomatis kedaluwarsa dalam **10 menit** kalau belum dibayar.

```
POST /api/orders
```

**Request body**

| Field         | Tipe   | Wajib | Keterangan |
|---------------|--------|-------|------------|
| `amount`      | number | ✅    | Harga dasar dalam rupiah (bilangan bulat > 0) |
| `note`        | string | —     | Keterangan order (mis. "Order #123 - Kopi") |
| `provider`    | string | —     | `dana_bisnis`, `gopay_merchant`, atau `ANY` (default) |
| `callbackUrl` | string | —     | URL webhook web utama; dipanggil saat order LUNAS (lihat `INTEGRATION.md`) |
| `redirectUrl` | string | —     | URL tujuan redirect customer setelah bayar (dipakai halaman `/pay`) |

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

➡️ Tampilkan **`qris.image`** (gambar QR dinamis) ke customer — nominalnya sudah terkunci ke `amount`, jadi customer tinggal scan tanpa mengetik jumlah.

| Field       | Keterangan |
|-------------|------------|
| `qris.payload` | String QRIS dinamis (EMV) hasil konversi dari QRIS statis + nominal unik |
| `qris.image`   | Data URL PNG QR siap `<img src="...">` |
| `qrisError`    | Berisi pesan bila QR gagal dibuat (mis. `QRIS_STATIC` belum diset); selain itu `null` |

> QR dinamis dibuat dari env **`QRIS_STATIC`** (QRIS statis merchant). Bila belum diset, `qris` = `null` dan order tetap dibuat (customer bayar manual sesuai `amount`).

**Error**
- `400` — `amount` tidak valid / `provider` tidak dikenal.
- `409` — gagal membuat nominal unik (terlalu banyak order aktif dengan harga dasar sama).

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

> **Tips polling:** frontend cukup polling endpoint ini tiap 3–5 detik sampai `status` jadi `PAID` atau `EXPIRED`.

**Error**
- `404` — order tidak ditemukan.

---

## 3. Kirim Notifikasi (khusus HP)

Dipanggil oleh **aplikasi Android** setiap kali ada notif pembayaran masuk.
Server akan mencocokkan `amount` dengan order `PENDING` dan menandainya `PAID`.

```
POST /api/notif
Header: X-API-Key: <LISTENER_API_KEY>
```

**Request body**

| Field           | Tipe   | Wajib | Keterangan |
|-----------------|--------|-------|------------|
| `amount`        | number | ✅    | Nominal yang terbaca dari notif (bilangan bulat) |
| `provider`      | string | —     | `dana_bisnis` / `gopay_merchant` (asal notif) |
| `rawText`       | string | —     | Teks mentah notif (buat audit/debug) |
| `transactionId` | string | —     | ID transaksi bila ada (untuk dedup lebih akurat) |

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
- `401` — `X-API-Key` salah / tidak ada.
- `400` — `amount` tidak valid.

> **Idempotency:** notif dianggap duplikat berdasarkan `transactionId` (bila ada) atau hash dari `provider + amount + rawText`. Notif dobel tidak akan melunasi order dua kali.

---

## Catatan Keamanan

- `LISTENER_API_KEY` **wajib** dirahasiakan — hanya ada di server (env) dan di HP kamu.
- Jangan pernah menaruh logika keuangan penting hanya di HP; server adalah sumber kebenaran (source of truth).
- Semua endpoint sebaiknya diakses lewat HTTPS (otomatis di Vercel).
