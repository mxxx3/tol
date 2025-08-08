package com.neatgamebot.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.neatgamebot.MainActivity
import com.neatgamebot.R

class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    
    companion object {
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "overlay_service_channel"
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            startForeground(NOTIFICATION_ID, createNotification())
            showOverlay()
        } catch (e: SecurityException) {
            // Handle Android 14+ restrictions - service can still work without foreground
            MainActivity.instance?.addLog("Overlay service running in background mode due to system restrictions")
            showOverlay()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Game Bot Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controls for the game bot overlay"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NEAT Game Bot")
            .setContentText("Bot overlay is active")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun showOverlay() {
        if (overlayView != null) return
        
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_controls, null)
        
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 20
            y = 100
        }

        setupOverlayControls()
        windowManager.addView(overlayView, layoutParams)
    }

    private fun setupOverlayControls() {
        overlayView?.let { view ->
            val statusText: TextView = view.findViewById(R.id.overlayStatusText)
            val stopButton: Button = view.findViewById(R.id.overlayStopButton)
            val testButton: Button = view.findViewById(R.id.overlayTestButton)
            
            stopButton.setOnClickListener {
                MainActivity.instance?.run {
                    runOnUiThread {
                        // Stop bot from main activity
                        findViewById<Button>(R.id.stopButton).performClick()
                    }
                }
            }
            
            testButton.setOnClickListener {
                GameBotAccessibilityService.performTestClick()
                MainActivity.instance?.addLog("Test click from overlay")
            }
            
            // Update status periodically
            view.postDelayed(object : Runnable {
                override fun run() {
                    if (GameBotAccessibilityService.isServiceActive()) {
                        statusText.text = "Bot Active"
                        statusText.setTextColor(getColor(R.color.success_color))
                    } else {
                        statusText.text = "Bot Stopped"
                        statusText.setTextColor(getColor(R.color.inactive_color))
                    }
                    view.postDelayed(this, 1000)
                }
            }, 1000)
        }
    }

    private fun hideOverlay() {
        overlayView?.let {
            windowManager.removeView(it)
            overlayView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
}
