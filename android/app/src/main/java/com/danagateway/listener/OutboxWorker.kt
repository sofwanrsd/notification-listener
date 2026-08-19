package com.danagateway.listener

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Worker yang mencoba kirim ulang antrean [Outbox] secara berkala saat ada koneksi.
 * Ini jaring pengaman tambahan bila listener/foreground service tidak sempat flush.
 */
class OutboxWorker(
    ctx: Context,
    params: WorkerParameters,
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        return try {
            Outbox.flush(applicationContext)
            Result.success()
        } catch (e: Exception) {
            // Coba lagi nanti (mis. gangguan jaringan sesaat).
            Result.retry()
        }
    }

    companion object {
        private const val WORK_NAME = "outbox_retry"

        /** Jadwalkan retry periodik (tiap 15 menit) saat perangkat online. */
        fun schedule(ctx: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<OutboxWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }
    }
}
