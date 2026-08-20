package com.danagateway.listener

import android.content.Context
import android.content.SharedPreferences

/** Penyimpanan pengaturan sederhana berbasis SharedPreferences. */
object Settings {
    private const val PREFS = "dana_gateway_prefs"

    // Mode tujuan pengiriman. taveve = integrasi Notification Listener di Taveve,
    // standalone = backend gateway kita sendiri.
    const val MODE_TAVEVE = "taveve"
    const val MODE_STANDALONE = "standalone"
    val MODES = listOf(MODE_TAVEVE, MODE_STANDALONE)

    fun get(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun serverUrl(ctx: Context): String = get(ctx).getString("server_url", "") ?: ""
    fun apiKey(ctx: Context): String = get(ctx).getString("api_key", "") ?: ""
    fun activeProvider(ctx: Context): String =
        get(ctx).getString("active_provider", Providers.ALL.first().id) ?: Providers.ALL.first().id
    fun forwardingEnabled(ctx: Context): Boolean = get(ctx).getBoolean("forwarding_enabled", true)
    fun mode(ctx: Context): String = get(ctx).getString("mode", MODE_TAVEVE) ?: MODE_TAVEVE

    fun save(ctx: Context, serverUrl: String, apiKey: String, provider: String, enabled: Boolean, mode: String) {
        get(ctx).edit()
            .putString("server_url", serverUrl.trim())
            .putString("api_key", apiKey.trim())
            .putString("active_provider", provider)
            .putBoolean("forwarding_enabled", enabled)
            .putString("mode", mode)
            .apply()
    }
}
