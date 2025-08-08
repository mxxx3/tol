package com.neatgamebot.models

data class GameStats(
    var clicks: Int = 0,
    var score: Int = 0,
    var attempts: Int = 0
) {
    val successRate: Double
        get() = if (clicks > 0) (score.toDouble() / clicks.toDouble()) * 100 else 0.0

    fun incrementClicks() {
        clicks++
        attempts++
    }

    fun updateScore(newScore: Int) {
        if (newScore > score) {
            score = newScore
        }
    }

    fun reset() {
        clicks = 0
        score = 0
        attempts = 0
    }
}
