package com.danagateway.listener

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.service.notification.NotificationListenerService

/**
 * Setelah HP reboot, minta sistem mengikat ulang (rebind) NotificationListenerService
 * agar listener langsung aktif tanpa perlu buka aplikasi.
 *
 * Catatan: di ROM agresif (XOS/Infinix, MIUI, dll) broadcast BOOT_COMPLETED hanya
 * dikirim ke aplikasi yang diizinkan "Autostart". Pastikan Autostart untuk app ini ON.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            -> {
                NotificationListenerService.requestRebind(
                    ComponentName(context, PaymentNotificationListener::class.java),
                )
            }
        }
    }
}
