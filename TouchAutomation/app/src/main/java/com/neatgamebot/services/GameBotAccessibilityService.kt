package com.neatgamebot.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Point
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.neatgamebot.MainActivity
import com.neatgamebot.models.BotStrategy
import com.neatgamebot.models.GameStats
import kotlinx.coroutines.*

class GameBotAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var botJob: Job? = null
    private var isActive = false
    private var currentStrategy = BotStrategy.PERIODIC
    private var gameStats = GameStats()
    private var screenWidth = 0
    private var screenHeight = 0

    companion object {
        private var instance: GameBotAccessibilityService? = null

        fun startBot(strategy: BotStrategy) {
            instance?.startBotInternal(strategy)
        }

        fun stopBot() {
            instance?.stopBotInternal()
        }

        fun performTestClick() {
            instance?.performClick()
        }

        fun isServiceActive(): Boolean {
            return instance != null
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        
        // Get screen dimensions
        val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        val display = windowManager.defaultDisplay
        val size = Point()
        display.getSize(size)
        screenWidth = size.x
        screenHeight = size.y
        
        MainActivity.instance?.addLog("Accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Monitor accessibility events if needed for game state detection
        if (event?.packageName?.contains("webview") == true || 
            event?.packageName?.contains("chrome") == true) {
            // Web content changed, might need to update game state
            updateGameState()
        }
    }

    override fun onInterrupt() {
        stopBotInternal()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        stopBotInternal()
    }

    private fun startBotInternal(strategy: BotStrategy) {
        if (isActive) return
        
        currentStrategy = strategy
        isActive = true
        gameStats.reset()
        
        MainActivity.instance?.onBotStatusChanged(true)
        MainActivity.instance?.addLog("Bot started with ${strategy.displayName}")
        
        botJob = CoroutineScope(Dispatchers.Main).launch {
            runBotLoop()
        }
    }

    private fun stopBotInternal() {
        isActive = false
        botJob?.cancel()
        botJob = null
        
        MainActivity.instance?.onBotStatusChanged(false)
        MainActivity.instance?.addLog("Bot stopped - Final stats: ${gameStats.clicks} clicks, ${gameStats.score} score")
    }

    private suspend fun runBotLoop() {
        while (isActive) {
            try {
                // Check for restart button first
                if (checkAndClickRestart()) {
                    MainActivity.instance?.addLog("Restart button found and clicked!")
                    delay(2000) // Wait for game to restart
                    continue
                }
                
                performClick()
                updateGameState()
                
                val delayMs = when (currentStrategy) {
                    BotStrategy.PERIODIC -> 1500L
                    BotStrategy.FAST_RESPONSE -> 800L
                    BotStrategy.SLOW_STEADY -> 2200L
                    BotStrategy.ADAPTIVE -> calculateAdaptiveDelay()
                }
                
                delay(delayMs)
            } catch (e: Exception) {
                MainActivity.instance?.addLog("Bot error: ${e.message}")
                delay(1000)
            }
        }
    }

    private fun calculateAdaptiveDelay(): Long {
        // Adaptive strategy: faster if success rate is good, slower if poor
        return when {
            gameStats.successRate > 80 -> 1000L
            gameStats.successRate > 60 -> 1200L
            gameStats.successRate > 40 -> 1500L
            else -> 1800L
        }
    }

    private fun performClick() {
        if (!isActive) return
        
        // Click in the center of the screen (where the game typically is)
        val centerX = screenWidth / 2f
        val centerY = screenHeight / 2f
        
        performClickAt(centerX, centerY)
        
        gameStats.incrementClicks()
        MainActivity.instance?.updateStats(gameStats)
    }

    private fun performClickAt(x: Float, y: Float) {
        try {
            val path = Path().apply {
                moveTo(x, y)
            }
            
            val gesture = GestureDescription.Builder()
                .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
                .build()
            
            dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    MainActivity.instance?.addLog("Touch gesture completed at ($x, $y)")
                }
                
                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    MainActivity.instance?.addLog("Touch gesture cancelled - retrying")
                    // Retry the touch after a short delay
                    handler.postDelayed({
                        if (isActive) performClickAt(x, y)
                    }, 200)
                }
            }, null)
        } catch (e: Exception) {
            MainActivity.instance?.addLog("Touch error: ${e.message}")
        }
    }

    private fun updateGameState() {
        // Try to detect game state from accessibility tree
        val rootNode = rootInActiveWindow ?: return
        
        try {
            val gameState = analyzeGameState(rootNode)
            if (gameState.score > gameStats.score) {
                gameStats.updateScore(gameState.score)
                MainActivity.instance?.updateStats(gameStats)
            }
        } catch (e: Exception) {
            // Ignore accessibility analysis errors
        } finally {
            rootNode.recycle()
        }
    }

    private fun analyzeGameState(node: AccessibilityNodeInfo): GameState {
        var score = 0
        var gameStarted = true
        var gameOver = false
        
        // Recursively search for score indicators
        searchForScoreInNode(node)?.let { foundScore ->
            score = foundScore
        }
        
        // Look for game over indicators
        if (findTextInNode(node, listOf("game over", "try again", "restart"))) {
            gameOver = true
        }
        
        // Look for start indicators
        if (findTextInNode(node, listOf("tap to start", "click to start", "get ready"))) {
            gameStarted = false
        }
        
        return GameState(gameStarted, gameOver, score)
    }

    private fun searchForScoreInNode(node: AccessibilityNodeInfo): Int? {
        // Check current node text
        node.text?.toString()?.let { text ->
            val scoreRegex = Regex("score[:\\s]*(\\d+)", RegexOption.IGNORE_CASE)
            scoreRegex.find(text)?.groupValues?.get(1)?.toIntOrNull()?.let {
                return it
            }
            
            // Check for standalone numbers that might be scores
            if (text.matches(Regex("^\\d+$"))) {
                return text.toIntOrNull()
            }
        }
        
        // Check child nodes
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                searchForScoreInNode(child)?.let { return it }
                child.recycle()
            }
        }
        
        return null
    }

    private fun findTextInNode(node: AccessibilityNodeInfo, searchTerms: List<String>): Boolean {
        val nodeText = node.text?.toString()?.lowercase() ?: ""
        
        if (searchTerms.any { nodeText.contains(it) }) {
            return true
        }
        
        // Check child nodes
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                if (findTextInNode(child, searchTerms)) {
                    child.recycle()
                    return true
                }
                child.recycle()
            }
        }
        
        return false
    }

    private fun checkAndClickRestart(): Boolean {
        try {
            // Look for RESTART button using accessibility
            val rootNode = rootInActiveWindow ?: return false
            
            // Search for restart button by text
            val restartButtons = findNodesByText(rootNode, listOf("restart", "try again", "play again"))
            
            for (button in restartButtons) {
                if (button.isClickable) {
                    MainActivity.instance?.addLog("Found restart button: ${button.text}")
                    button.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    gameStats.reset() // Reset stats for new game
                    return true
                }
            }
            
            return false
        } catch (e: Exception) {
            MainActivity.instance?.addLog("Error checking restart button: ${e.message}")
            return false
        }
    }
    
    private fun findNodesByText(root: AccessibilityNodeInfo, searchTexts: List<String>): List<AccessibilityNodeInfo> {
        val found = mutableListOf<AccessibilityNodeInfo>()
        
        fun searchNode(node: AccessibilityNodeInfo) {
            val nodeText = node.text?.toString()?.lowercase() ?: ""
            val nodeDesc = node.contentDescription?.toString()?.lowercase() ?: ""
            
            for (searchText in searchTexts) {
                if (nodeText.contains(searchText) || nodeDesc.contains(searchText)) {
                    found.add(node)
                    break
                }
            }
            
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { searchNode(it) }
            }
        }
        
        searchNode(root)
        return found
    }

    private data class GameState(
        val started: Boolean,
        val gameOver: Boolean,
        val score: Int
    )
}
