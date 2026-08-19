package com.danagateway.listener

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Klien HTTP minimal (tanpa dependency tambahan) untuk mengirim notif ke backend. */
object ApiClient {

    suspend fun postNotif(
        serverUrl: String,
        apiKey: String,
        provider: String,
        amount: Int,
        rawText: String,
        txId: String?,
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val endpoint = serverUrl.trimEnd('/') + "/api/notif"
            val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("X-API-Key", apiKey)
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
        apiKey: String,
        provider: String,
        amount: Int,
        rawText: String,
        txId: String?,
        attempts: Int = 3,
    ): Boolean {
        repeat(attempts) { i ->
            if (postNotif(serverUrl, apiKey, provider, amount, rawText, txId)) return true
            if (i < attempts - 1) delay(1500L * (i + 1))
        }
        return false
    }
}
