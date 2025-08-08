package com.neatgamebot

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.neatgamebot.models.BotStrategy
import com.neatgamebot.models.GameStats
import com.neatgamebot.services.GameBotAccessibilityService
import com.neatgamebot.services.OverlayService
import com.neatgamebot.utils.PermissionHelper
import com.neatgamebot.utils.WebViewHelper

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var urlEditText: EditText
    private lateinit var strategySpinner: Spinner
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var testButton: Button
    private lateinit var statusIndicator: View
    private lateinit var statusText: TextView
    private lateinit var clicksText: TextView
    private lateinit var scoreText: TextView
    private lateinit var successRateText: TextView
    private lateinit var logsScrollView: ScrollView
    private lateinit var logsTextView: TextView

    private var gameStats = GameStats()
    private val logMessages = mutableListOf<String>()

    companion object {
        var instance: MainActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        instance = this
        
        initializeViews()
        setupWebView()
        setupSpinner()
        setupButtons()
        
        checkPermissions()
    }

    private fun initializeViews() {
        webView = findViewById<WebView>(R.id.webView)
        urlEditText = findViewById<EditText>(R.id.urlEditText)
        strategySpinner = findViewById<Spinner>(R.id.strategySpinner)
        startButton = findViewById<Button>(R.id.startButton)
        stopButton = findViewById<Button>(R.id.stopButton)
        testButton = findViewById<Button>(R.id.testButton)
        statusIndicator = findViewById<View>(R.id.statusIndicator)
        statusText = findViewById<TextView>(R.id.statusText)
        clicksText = findViewById<TextView>(R.id.clicksText)
        scoreText = findViewById<TextView>(R.id.scoreText)
        successRateText = findViewById<TextView>(R.id.successRateText)
        logsScrollView = findViewById<ScrollView>(R.id.logsScrollView)
        logsTextView = findViewById<TextView>(R.id.logsTextView)
        
        // Set default URL
        urlEditText.setText("https://ppkas.com/#crazyRo")
        
        updateBotStatus(false)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        WebViewHelper.setupWebView(webView) { url ->
            urlEditText.setText(url)
        }
        
        // Load initial URL
        webView.loadUrl(urlEditText.text.toString())
    }

    private fun setupSpinner() {
        val strategies = BotStrategy.values().map { it.displayName }
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, strategies)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        strategySpinner.adapter = adapter
    }

    private fun setupButtons() {
        startButton.setOnClickListener {
            if (checkPermissions()) {
                startBot()
            }
        }
        
        stopButton.setOnClickListener {
            stopBot()
        }
        
        testButton.setOnClickListener {
            testClick()
        }
        
        urlEditText.setOnEditorActionListener { _, _, _ ->
            val url = urlEditText.text.toString()
            if (url.isNotEmpty()) {
                webView.loadUrl(if (url.startsWith("http")) url else "https://$url")
            }
            false
        }
    }

    private fun checkPermissions(): Boolean {
        val hasPermissions = PermissionHelper.checkAndRequestPermissions(this)
        addLog("Permissions check result: $hasPermissions")
        return hasPermissions
    }

    private fun startBot() {
        val selectedStrategy = BotStrategy.values()[strategySpinner.selectedItemPosition]
        
        // Check if accessibility service is available
        if (!GameBotAccessibilityService.isServiceActive()) {
            addLog("Accessibility service not active - checking permissions again")
            if (!checkPermissions()) {
                addLog("Cannot start bot - accessibility service not enabled")
                return
            }
        }
        
        // Start accessibility service
        GameBotAccessibilityService.startBot(selectedStrategy)
        
        // Start overlay service
        val overlayIntent = Intent(this, OverlayService::class.java)
        startService(overlayIntent)
        
        updateBotStatus(true)
        addLog("Bot started with ${selectedStrategy.displayName} strategy")
    }

    private fun stopBot() {
        GameBotAccessibilityService.stopBot()
        
        val overlayIntent = Intent(this, OverlayService::class.java)
        stopService(overlayIntent)
        
        updateBotStatus(false)
        addLog("Bot stopped")
    }

    private fun testClick() {
        GameBotAccessibilityService.performTestClick()
        addLog("Test click performed")
    }

    private fun updateBotStatus(isActive: Boolean) {
        statusIndicator.setBackgroundColor(
            ContextCompat.getColor(
                this,
                if (isActive) R.color.success_color else R.color.inactive_color
            )
        )
        statusText.text = if (isActive) "Active" else "Stopped"
        
        startButton.isEnabled = !isActive
        stopButton.isEnabled = isActive
    }

    fun updateStats(stats: GameStats) {
        runOnUiThread {
            gameStats = stats
            clicksText.text = stats.clicks.toString()
            scoreText.text = stats.score.toString()
            successRateText.text = String.format("%.1f%%", stats.successRate)
        }
    }

    fun addLog(message: String) {
        runOnUiThread {
            val timestamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
                .format(java.util.Date())
            val logEntry = "[$timestamp] $message"
            
            logMessages.add(logEntry)
            if (logMessages.size > 50) {
                logMessages.removeAt(0)
            }
            
            logsTextView.text = logMessages.joinToString("\n")
            logsScrollView.post {
                logsScrollView.fullScroll(ScrollView.FOCUS_DOWN)
            }
        }
    }

    fun onBotStatusChanged(isActive: Boolean) {
        runOnUiThread {
            updateBotStatus(isActive)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        stopBot()
    }
}
