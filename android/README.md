# Android Listener

Aplikasi Android (Kotlin) yang membaca notifikasi pembayaran masuk lalu mengirim nominalnya ke backend untuk dicocokkan dengan order.

Fokus DANA saja. Versi ini hanya mendukung satu provider, yaitu DANA (`id.dana`), dengan pola notif terverifikasi `Rp<nominal> diterima`.

Foreground service menjaga proses tetap hidup. Sebuah notifikasi persisten berprioritas rendah membuat sistem enggan mematikan aplikasi, sehingga `NotificationListenerService` tetap terikat. Ini penting di ROM agresif seperti XOS atau Infinix. Service dimulai otomatis setelah konfigurasi disimpan dan saat boot.

## Build

Buka folder `android/` di Android Studio, tunggu Gradle sync, lalu Run ke HP kamu. Atau lewat command line:

```bash
cd android
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

minSdk 24 (Android 7.0). Butuh JDK 17.

## Setup di HP (urutan penting)

1. Isi konfigurasi di app. Server URL (misalnya `https://xxx.vercel.app`), API Key (sama dengan `LISTENER_API_KEY` di backend), pilih provider aktif, lalu Simpan.
2. Tekan "1. Izinkan akses notifikasi", lalu aktifkan Notification Listener di daftar. Ini izin `NotificationListenerService`.
3. Tekan "2. Abaikan optimasi baterai", lalu pilih Izinkan.

## Khusus Infinix (XOS / Transsion), wajib biar tidak dimatikan

HP Infinix sangat agresif mematikan aplikasi background. Lakukan semua ini.

- Kunci aplikasi di Recent Apps. Buka menu multitasking, tahan kartu Notification Listener, tekan ikon gembok.
- Autostart. Settings, App Management, Notification Listener, aktifkan Autostart.
- Power Marathon atau penghemat daya. Settings, Battery, matikan pembatasan untuk Notification Listener.
- Phone Master atau pembersih. Tambahkan Notification Listener ke whitelist agar tidak ikut dibersihkan.
- Pastikan izin notifikasi app tidak dibatasi.

Nama menu bisa sedikit beda tergantung versi XOS. Intinya autostart aktif, baterai tanpa batasan, lock di recent, dan whitelist di Phone Master.

## Menemukan format notif (mode debug)

Karena format teks notif bisa berbeda antar versi DANA, app merekam notif ke bagian Log notifikasi.

1. Aktifkan akses notifikasi (langkah 2 di atas).
2. Lakukan satu transaksi kecil ke QRIS kamu.
3. Buka app, tekan Refresh log, cari baris yang diawali `[id.dana]`.
4. Lihat teks aslinya, misalnya `[id.dana] Rp1.000 diterima DANA Bisnis.`.
5. Kalau nominal tidak terbaca atau package berbeda, sesuaikan di `app/.../Providers.kt`.
   - `packageNames` sesuai yang muncul di log.
   - `paymentPattern` regex notif uang masuk (grup 1 adalah nominal).
   - `AmountParser` sudah mendukung `Rp`, `IDR`, dan `sebesar Rp`.

Catatan. Package `id.dana` dan pola `Rp<nominal> diterima` sudah diverifikasi dari HP.

## Cara kerja singkat

```
Notif masuk, catat ke log debug
   kalau dari provider aktif dan mengandung kata uang masuk
   parse nominal (Rp50.347 jadi 50347)
   POST ke <server>/api/notif (header X-API-Key)
   kalau gagal, masuk antrean (Outbox), dicoba ulang saat listener atau
   foreground service aktif lagi, dan secara periodik lewat WorkManager saat online
```

## Keamanan

- API Key disimpan lokal di HP (SharedPreferences). Jangan bagikan screenshot yang memuatnya.
- App hanya membaca notif. Tidak mengakses saldo atau mengontrol aplikasi e-wallet.
