# Android Listener — Notification Listener

Aplikasi Android (Kotlin) yang membaca notifikasi pembayaran masuk dan mengirim nominalnya ke backend untuk dicocokkan dengan order.

> **Fokus DANA saja.** Versi ini hanya mendukung satu provider: **DANA** (`id.dana`),
> dengan pola notif terverifikasi `Rp<nominal> diterima`. Provider lain sudah dihapus.
>
> **Foreground service** menjaga proses tetap hidup: sebuah notifikasi persisten
> berprioritas rendah ("Notification Listener aktif") membuat sistem enggan mematikan
> aplikasi, sehingga `NotificationListenerService` tetap terikat — penting di ROM agresif
> seperti XOS/Infinix. Service dimulai otomatis setelah konfigurasi disimpan dan saat boot.

## Build

Buka folder `android/` di **Android Studio** (Giraffe/Koala atau lebih baru), tunggu Gradle sync, lalu **Run** ke HP kamu. Atau via command line:

```bash
cd android
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

> minSdk 24 (Android 7.0). Butuh JDK 17.

## Setup di HP (urutan penting)

1. **Isi konfigurasi** di app: Server URL (mis. `https://xxx.vercel.app`), API Key (sama dengan `LISTENER_API_KEY` di backend), pilih **Provider aktif**, lalu **Simpan**.
2. Tekan **"1. Izinkan akses notifikasi"** → aktifkan **DANA Gateway** di daftar. (Ini izin `NotificationListenerService`.)
3. Tekan **"2. Abaikan optimasi baterai"** → pilih **Izinkan**.

## ⚠️ Khusus Infinix (XOS / Transsion) — WAJIB biar tidak dimatikan

HP Infinix sangat agresif mematikan aplikasi background. Lakukan semua ini:

- **Kunci aplikasi di Recent Apps**: buka menu multitasking → tahan/geser kartu **DANA Gateway** → tekan ikon **gembok** (lock).
- **Auto-launch / Autostart**: Settings → **App Management** → DANA Gateway → aktifkan **Auto-launch / Autostart**.
- **Power Marathon / Penghemat daya**: Settings → **Battery** → matikan pembatasan untuk DANA Gateway (set ke **No restrictions / Allow background**).
- **Phone Master / Pembersih**: buka aplikasi **Phone Master** bawaan → **Whitelist / Protect** → tambahkan DANA Gateway agar tidak ikut dibersihkan.
- **Notifikasi**: pastikan izin notifikasi app tidak dibatasi.

> Nama menu bisa sedikit beda tergantim versi XOS. Intinya: **autostart ON, battery unrestricted, lock di recent, whitelist di Phone Master**.

## Cara menemukan format notif (mode debug)

Karena format teks notif DANA/GoPay bisa berbeda, app ini merekam **semua** notif di bagian **"Log notifikasi (debug)"**.

1. Aktifkan akses notifikasi (langkah 2 di atas).
2. Lakukan **1 transaksi kecil** ke QRIS kamu (atau minta orang transfer receh).
3. Buka app → **Refresh log** → cari baris yang diawali dengan package DANA:
   - DANA: `[id.dana]`
4. Lihat teks aslinya, mis. `[id.dana] Rp1.000 diterima DANA Bisnis.`.
5. Kalau nominal tidak terbaca / package berbeda, sesuaikan di **`app/.../Providers.kt`**:
   - `packageNames` → sesuai yang muncul di log.
   - `paymentPattern` → regex notif "uang masuk" (grup 1 = nominal).
   - `AmountParser` → sudah mendukung `Rp`, `IDR`, dan `sebesar Rp`.

> **Catatan:** package `id.dana` dan pola `Rp<nominal> diterima` sudah diverifikasi dari HP.

## Cara kerja singkat

```
Notif masuk → catat ke log debug
   → kalau dari provider aktif & mengandung kata "uang masuk"
   → parse nominal (Rp50.347 → 50347)
   → POST ke <server>/api/notif (header X-API-Key)
   → gagal? masuk antrean (Outbox), dicoba ulang saat listener/foreground service
     aktif lagi, dan secara periodik (±15 menit) lewat WorkManager saat online
```

## Keamanan

- API Key disimpan lokal di HP (SharedPreferences). Jangan share screenshot yang memuatnya.
- App hanya **membaca** notif; tidak mengakses saldo atau mengontrol aplikasi e-wallet.
