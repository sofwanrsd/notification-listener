package com.danagateway.listener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Foreground service yang menjaga proses aplikasi tetap hidup di ROM agresif
 * (XOS/Infinix, MIUI, dll). Menampilkan notifikasi persisten berprioritas rendah
 * sehingga sistem enggan mematikan proses; ini membantu NotificationListenerService
 * tetap terikat.
 *
 * targetSdk 35: pakai foregroundServiceType "specialUse" + property subtype di manifest,
 * dan panggil startForeground dengan FOREGROUND_SERVICE_TYPE_SPECIAL_USE.
 */
class ListenerForegroundService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
            )
        } else {
            startForeground(NOTIF_ID, notification)
        }

        // Selagi proses hidup, coba kirim ulang antrean yang tertunda.
        scope.launch { Outbox.flush(applicationContext) }

        // Jadwalkan retry periodik lewat WorkManager sebagai jaring pengaman.
        OutboxWorker.schedule(applicationContext)

        // START_STICKY: sistem coba jalankan ulang service bila sempat dimatikan.
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Layanan Listener",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Menjaga listener notifikasi pembayaran tetap aktif."
                setShowBadge(false)
            }
            val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            mgr.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Notification Listener aktif")
            .setContentText("Mendengarkan notifikasi pembayaran DANA.")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setShowWhen(false)
            .build()

    companion object {
        private const val CHANNEL_ID = "listener_fgs"
        private const val NOTIF_ID = 1001

        /** Mulai service secara aman (memenuhi aturan startForegroundService). */
        fun start(ctx: Context) {
            val intent = Intent(ctx, ListenerForegroundService::class.java)
            androidx.core.content.ContextCompat.startForegroundService(ctx, intent)
        }
    }
}
