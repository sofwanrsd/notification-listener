package com.danagateway.listener

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Klien HTTP minimal (tanpa dependency tambahan) untuk mengirim nominal notif
 * ke backend. Path dan nama header auth ditentukan oleh mode:
 *
 *   taveve      -> POST <server>/api/payments/notif-listener/ingest, header X-Listener-Key
 *   standalone  -> POST <server>/api/notif,                          header X-API-Key
 */
object ApiClient {

    fun pathFor(mode: String): String =
        if (mode == Settings.MODE_STANDALONE) "/api/notif" else "/api/payments/notif-listener/ingest"

    fun headerFor(mode: String): String =
        if (mode == Settings.MODE_STANDALONE) "X-API-Key" else "X-Listener-Key"

    suspend fun postNotif(
        serverUrl: String,
        mode: String,
        apiKey: String,
        provider: String,
        amount: Int,
        rawText: String,
        txId: String?,
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val endpoint = serverUrl.trimEnd('/') + pathFor(mode)
            val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty(headerFor(mode), apiKey)
            }
            val body = JSONObject().apply {
                put("amount", amount)
                put("provider", provider)
                put("rawText", rawText)
                if (txId != null) put("transactionId", txId)
            }.toString()

            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            conn.disconnect()
            code in 200..299
        } catch (e: Exception) {
            false
        }
    }

    suspend fun postNotifWithRetry(
        serverUrl: String,
        mode: String,
        apiKey: String,
        provider: String,
        amount: Int,
        rawText: String,
        txId: String?,
        attempts: Int = 3,
    ): Boolean {
        repeat(attempts) { i ->
            if (postNotif(serverUrl, mode, apiKey, provider, amount, rawText, txId)) return true
            if (i < attempts - 1) delay(1500L * (i + 1))
        }
        return false
    }
}
