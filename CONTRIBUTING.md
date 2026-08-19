# Berkontribusi

Terima kasih sudah tertarik! Kontribusi terbuka untuk siapa saja.

## Alur

1. **Fork** repo ini, lalu `git clone` fork kamu.
2. Buat branch: `git checkout -b fitur/nama-fitur`.
3. Lakukan perubahan + uji.
4. Commit dengan pesan jelas (bahasa Indonesia/Inggris, deskriptif).
5. Push & buka **Pull Request** ke repo utama.

## Aturan penting

- **Jangan pernah commit rahasia**: `.env`, API key, connection string, nomor akun, screenshot yang memuat kredensial. `.gitignore` sudah menutup `.env`, tapi tetap periksa `git diff` sebelum commit.
- Jaga gaya kode konsisten dengan yang ada.
- Untuk perubahan besar, buka **Issue** dulu untuk diskusi.

## Fokus proyek: DANA saja

Proyek ini **sengaja hanya mendukung DANA** (package `id.dana`, format notif
"Rp<nominal> diterima DANA Bisnis"). Ini menjaga parser notif dan alur pencocokan
tetap sederhana dan andal.

- Kontribusi yang paling diterima: **perbaikan bug**, **keandalan** (mis. foreground
  service, autostart), **dokumentasi**, dan **peningkatan parser notif DANA**.
- **Menambah provider lain** (OVO, ShopeePay, GoPay, dll) **di luar cakupan** saat ini.
  Bila kamu punya alasan kuat, **buka Issue dulu** untuk diskusi sebelum mengirim PR.

Bila format notif DANA berubah, sesuaikan parser nominal dan sertakan contoh teks
notif (tanpa data pribadi/kredensial) di PR agar mudah diverifikasi.

## Struktur proyek

| Folder | Isi |
|--------|-----|
| `backend/` | API Next.js + Neon Postgres |
| `android/` | App Kotlin (NotificationListenerService) |
| `docs/` | Dokumentasi (`API.md`) |

## Testing backend cepat

```bash
cd backend && npm install && cp .env.example .env
# isi DATABASE_URL + LISTENER_API_KEY
npm run db:setup && npm run dev
```
