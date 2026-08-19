package com.danagateway.listener

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Buffer log sederhana untuk menampilkan notif yang tertangkap di layar (mode debug). */
object DebugLog {
    private const val MAX = 100
    private val entries = ArrayDeque<String>()
    private val fmt = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    /** Dipanggil UI untuk tahu kapan harus refresh. */
    @Volatile
    var listener: (() -> Unit)? = null

    fun add(line: String) {
        val stamped = "${fmt.format(Date())}  $line"
        synchronized(entries) {
            entries.addFirst(stamped)
            while (entries.size > MAX) entries.removeLast()
        }
        listener?.invoke()
    }

    fun snapshot(): List<String> = synchronized(entries) { entries.toList() }
}
