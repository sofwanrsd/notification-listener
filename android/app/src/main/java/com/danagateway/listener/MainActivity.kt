package com.danagateway.listener

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings as AndroidSettings
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var serverUrl: EditText
    private lateinit var apiKey: EditText
    private lateinit var providerSpinner: Spinner
    private lateinit var forwardingSwitch: Switch
    private lateinit var statusText: TextView
    private lateinit var debugLog: TextView

    // Izin notifikasi (Android 13+) supaya notifikasi foreground service bisa tampil.
    private val notifPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* abaikan hasil */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        requestNotificationPermission()

        serverUrl = findViewById(R.id.serverUrl)
        apiKey = findViewById(R.id.apiKey)
        providerSpinner = findViewById(R.id.providerSpinner)
        forwardingSwitch = findViewById(R.id.forwardingSwitch)
        statusText = findViewById(R.id.statusText)
        debugLog = findViewById(R.id.debugLog)

        // Isi spinner provider.
        val names = Providers.ALL.map { it.displayName }
        providerSpinner.adapter =
            ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, names)

        // Muat pengaturan tersimpan.
        serverUrl.setText(Settings.serverUrl(this))
        apiKey.setText(Settings.apiKey(this))
        forwardingSwitch.isChecked = Settings.forwardingEnabled(this)
        val activeIdx = Providers.ALL.indexOfFirst { it.id == Settings.activeProvider(this) }
        if (activeIdx >= 0) providerSpinner.setSelection(activeIdx)

        findViewById<Button>(R.id.saveButton).setOnClickListener { saveSettings() }
        findViewById<Button>(R.id.notifAccessButton).setOnClickListener {
            startActivity(Intent(AndroidSettings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        findViewById<Button>(R.id.batteryButton).setOnClickListener { openBatterySettings() }
        findViewById<Button>(R.id.refreshButton).setOnClickListener { refreshLog() }

        DebugLog.listener = { runOnUiThread { refreshLog() } }
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
        refreshLog()
        // Bila sudah dikonfigurasi, pastikan foreground service jalan menjaga listener hidup.
        if (isConfigured()) ListenerForegroundService.start(this)
    }

    private fun isConfigured(): Boolean =
        Settings.serverUrl(this).isNotBlank() && Settings.apiKey(this).isNotBlank()

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun saveSettings() {
        val provider = Providers.ALL[providerSpinner.selectedItemPosition]
        Settings.save(
            this,
            serverUrl.text.toString(),
            apiKey.text.toString(),
            provider.id,
            forwardingSwitch.isChecked,
        )
        Toast.makeText(this, "Tersimpan", Toast.LENGTH_SHORT).show()
        updateStatus()
        // Setelah konfigurasi disimpan, nyalakan foreground service penjaga listener.
        if (isConfigured()) ListenerForegroundService.start(this)
    }

    private fun updateStatus() {
        val enabled = AndroidSettings.Secure.getString(contentResolver, "enabled_notification_listeners")
            ?.contains(packageName) == true
        statusText.text = if (enabled) {
            "Status: ✅ akses notifikasi AKTIF"
        } else {
            "Status: ❌ akses notifikasi BELUM aktif (tekan tombol 1)"
        }
    }

    private fun openBatterySettings() {
        try {
            startActivity(
                Intent(AndroidSettings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                    .setData(Uri.parse("package:$packageName")),
            )
        } catch (e: Exception) {
            startActivity(Intent(AndroidSettings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }

    private fun refreshLog() {
        val lines = DebugLog.snapshot()
        debugLog.text = if (lines.isEmpty()) "(belum ada notif)" else lines.joinToString("\n")
    }
}
