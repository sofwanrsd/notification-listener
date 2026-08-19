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

## Menambah provider baru (mis. OVO, ShopeePay, SeaBank)

Cukup 2 langkah:

1. **Backend** — tambah entri di `backend/lib/providers.ts`:
   ```ts
   { id: 'ovo', displayName: 'OVO', androidPackage: 'club.ovo.app' }
   ```
2. **Android** — tambah entri di `android/app/src/main/java/com/danagateway/listener/Providers.kt`
   dengan `packageName` dan `incomingKeywords` yang sesuai. Verifikasi `packageName`
   lewat mode debug (lihat `android/README.md`).

Bila format nominal provider tidak standar, sesuaikan `AmountParser`.

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
