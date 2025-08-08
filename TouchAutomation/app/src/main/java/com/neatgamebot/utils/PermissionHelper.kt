package com.neatgamebot.utils

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import android.util.Log

object PermissionHelper {
    
    fun checkAndRequestPermissions(activity: Activity): Boolean {
        var allPermissionsGranted = true
        
        // Check overlay permission
        if (!Settings.canDrawOverlays(activity)) {
            allPermissionsGranted = false
            requestOverlayPermission(activity)
        }
        
        // Check accessibility service
        if (!isAccessibilityServiceEnabled(activity)) {
            allPermissionsGranted = false
            requestAccessibilityPermission(activity)
        }
        
        return allPermissionsGranted
    }
    
    private fun requestOverlayPermission(activity: Activity) {
        AlertDialog.Builder(activity)
            .setTitle("Overlay Permission Required")
            .setMessage("The app needs permission to display overlay controls over other apps. Please grant this permission in the next screen.")
            .setPositiveButton("Grant Permission") { _, _ ->
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${activity.packageName}")
                )
                activity.startActivity(intent)
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
                Toast.makeText(activity, "Overlay permission is required for the bot to work", Toast.LENGTH_LONG).show()
            }
            .show()
    }
    
    private fun requestAccessibilityPermission(activity: Activity) {
        AlertDialog.Builder(activity)
            .setTitle("Accessibility Service Required")
            .setMessage("The app needs accessibility service permission to perform automated touches. Please enable 'NEAT Game Bot' in the accessibility settings.")
            .setPositiveButton("Open Settings") { _, _ ->
                val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                activity.startActivity(intent)
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
                Toast.makeText(activity, "Accessibility service is required for automated touches", Toast.LENGTH_LONG).show()
            }
            .show()
    }
    
    private fun isAccessibilityServiceEnabled(activity: Activity): Boolean {
        val enabledServices = Settings.Secure.getString(
            activity.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        
        val serviceName = "${activity.packageName}/com.neatgamebot.services.GameBotAccessibilityService"
        val isEnabled = enabledServices?.contains(serviceName) == true
        
        Log.d("PermissionHelper", "Enabled services: $enabledServices")
        Log.d("PermissionHelper", "Looking for service: $serviceName")
        Log.d("PermissionHelper", "Service enabled: $isEnabled")
        
        return isEnabled
    }
}
