package com.danagateway.listener

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings as AndroidSettings
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var serverUrl: EditText
    private lateinit var apiKey: EditText
    private lateinit var providerSpinner: Spinner
    private lateinit var forwardingSwitch: Switch
    private lateinit var statusText: TextView
    private lateinit var debugLog: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
