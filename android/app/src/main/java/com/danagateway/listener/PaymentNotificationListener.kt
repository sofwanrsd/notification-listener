package com.danagateway.listener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Inti aplikasi: mendengarkan notifikasi yang muncul di HP.
 * - Merekam SEMUA notif ke [DebugLog] (mode debug, untuk menemukan format).
 * - Untuk provider aktif: parse nominal -> kirim ke backend.
 */
class PaymentNotificationListener : NotificationListenerService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onListenerConnected() {
        DebugLog.add("🔌 Listener terhubung")
        scope.launch { Outbox.flush(applicationContext) }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val ctx = applicationContext
        val provider = Providers.byId(Settings.activeProvider(ctx)) ?: return

        // PRIVASI (penting): saring package DULU. Kalau notif ini BUKAN dari aplikasi
        // provider aktif (mis. DANA / id.dana), langsung diabaikan — isinya (judul/teks)
        // TIDAK PERNAH dibaca, dicatat, apalagi dikirim ke mana pun.
        if (sbn.packageName !in provider.packageNames) return

        // Mulai dari sini dijamin hanya notif dari aplikasi provider aktif.
        val extras = sbn.notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString().orEmpty()
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString().orEmpty()
        val combined = listOf(title, text, bigText).filter { it.isNotBlank() }.joinToString(" ")

        // Log hanya untuk provider aktif (bantu lihat format notifnya).
        DebugLog.add("[${sbn.packageName}] $combined")

        if (!Settings.forwardingEnabled(ctx)) return

        // Ambil nominal: pola khusus (presisi) bila ada, jika tidak fallback ke kata kunci.
        val amount: Int? = if (provider.paymentPattern != null) {
            // Hanya notif "uang masuk" yang cocok pola ini (mis. "Rp1.000 diterima").
            // Notif lain (mis. "kamu bayar ...") diabaikan diam-diam.
            provider.paymentPattern.find(combined)?.let { AmountParser.normalize(it.groupValues[1]) }
        } else {
            val looksIncoming = provider.incomingKeywords.any { combined.contains(it, ignoreCase = true) }
            if (looksIncoming) AmountParser.parse(combined) else null
        }

        if (amount == null) {
            // Diam untuk notif yang memang bukan pembayaran; hanya log bila jelas "uang masuk".
            if (provider.paymentPattern == null &&
                provider.incomingKeywords.any { combined.contains(it, ignoreCase = true) }
            ) {
                DebugLog.add("⚠️ Cocok provider tapi nominal tak terbaca")
            }
            return
        }

        val server = Settings.serverUrl(ctx)
        val apiKey = Settings.apiKey(ctx)
        val mode = Settings.mode(ctx)
        if (server.isBlank() || apiKey.isBlank()) {
            DebugLog.add("⚠️ Server/API key belum diisi")
            return
        }

        // Dedup sederhana; server juga melakukan dedup.
        val txId = "${sbn.postTime}-$amount"
        scope.launch {
            val ok = ApiClient.postNotifWithRetry(server, mode, apiKey, provider.id, amount, combined.trim(), txId)
            if (ok) {
                DebugLog.add("✅ Terkirim: Rp$amount (${provider.id})")
            } else {
                Outbox.add(ctx, provider.id, amount, combined.trim(), txId)
                DebugLog.add("↩️ Gagal kirim, masuk antrean: Rp$amount")
            }
        }
    }
}
