package com.danagateway.listener

/**
 * Registry provider. Menambah provider baru = tambahkan satu entri di [ALL].
 *
 * - [packageNames]     : daftar package yang notifnya dianggap milik provider ini.
 * - [paymentPattern]   : (opsional) regex khusus notif "uang MASUK". Jika di-set, HANYA
 *   notif yang cocok pola ini yang diproses, dan grup 1 = nominal. Ini penting untuk
 *   membedakan notif "diterima" (penerima) vs "kamu bayar" (pembayar) di HP yang sama.
 * - [incomingKeywords] : dipakai bila [paymentPattern] null (provider belum terverifikasi);
 *   notif harus mengandung salah satunya lalu nominal diambil oleh [AmountParser].
 */
data class Provider(
    val id: String,
    val displayName: String,
    val packageNames: List<String>,
    val paymentPattern: Regex? = null,
    val incomingKeywords: List<String> = emptyList(),
)

object Providers {
    val ALL: List<Provider> = listOf(
        // TERVERIFIKASI dari HP: notif "Pembayaran Masuk" / "Rp1.000 diterima DANA Bisnis."
        // Pola "Rp<nominal> diterima" hanya cocok untuk notif PENERIMA, bukan notif pembayar.
        // Aplikasi ini fokus HANYA ke DANA (single-provider).
        Provider(
            id = "dana_bisnis",
            displayName = "DANA",
            packageNames = listOf("id.dana"),
            paymentPattern = Regex("""(?i)Rp\.?\s*([0-9][0-9.,]*)\s+diterima"""),
        ),
    )

    fun byId(id: String): Provider? = ALL.firstOrNull { it.id == id }
}

/**
 * Ekstraksi nominal rupiah generik (fallback untuk provider tanpa paymentPattern).
 * Mendukung "Rp50.347" / "Rp. 50.347,00" / "IDR 50347" / "sebesar Rp 50.347".
 */
object AmountParser {
    private val patterns = listOf(
        Regex("""(?i)\bsebesar\s+Rp\.?\s*([0-9][0-9.,]*)"""),
        Regex("""(?i)\bRp\.?\s?([0-9][0-9.,]*)"""),
        Regex("""(?i)\bIDR\s?([0-9][0-9.,]*)"""),
    )

    /** Ubah string angka ber-pemisah (mis. "1.000,00") menjadi Int (1000). */
    fun normalize(raw: String): Int? {
        val digits = raw.replace(".", "").replace(",", "").filter { it.isDigit() }
        return digits.toIntOrNull()?.takeIf { it > 0 }
    }

    fun parse(text: String): Int? {
        for (p in patterns) {
            val match = p.find(text) ?: continue
            val amount = normalize(match.groupValues[1])
            if (amount != null) return amount
        }
        return null
    }
}
