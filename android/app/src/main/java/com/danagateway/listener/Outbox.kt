package com.danagateway.listener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Antrean pembayaran yang gagal terkirim (mis. HP offline). Dicoba ulang nanti. */
object Outbox {
    private const val KEY = "outbox"

    fun add(ctx: Context, provider: String, amount: Int, rawText: String, txId: String?) {
        val arr = load(ctx)
        arr.put(JSONObject().apply {
            put("provider", provider)
            put("amount", amount)
            put("rawText", rawText)
            put("txId", txId ?: JSONObject.NULL)
        })
        Settings.get(ctx).edit().putString(KEY, arr.toString()).apply()
    }

    private fun load(ctx: Context): JSONArray =
        try {
            JSONArray(Settings.get(ctx).getString(KEY, "[]"))
        } catch (e: Exception) {
            JSONArray()
        }

    /** Coba kirim ulang semua item; simpan yang masih gagal. */
    suspend fun flush(ctx: Context) {
        val arr = load(ctx)
        if (arr.length() == 0) return

        val server = Settings.serverUrl(ctx)
        val apiKey = Settings.apiKey(ctx)
        val mode = Settings.mode(ctx)
        if (server.isBlank() || apiKey.isBlank()) return

        val remaining = JSONArray()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            val txId = if (o.isNull("txId")) null else o.optString("txId")
            val ok = ApiClient.postNotif(
                server, mode, apiKey,
                o.getString("provider"), o.getInt("amount"), o.optString("rawText"), txId,
            )
            if (!ok) remaining.put(o)
        }
        Settings.get(ctx).edit().putString(KEY, remaining.toString()).apply()
        if (remaining.length() > 0) {
            DebugLog.add("↩️ ${remaining.length()} pembayaran masih di antrean")
        }
    }
}
