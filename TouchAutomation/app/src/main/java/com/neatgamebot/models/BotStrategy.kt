package com.neatgamebot.models

enum class BotStrategy(val displayName: String, val description: String) {
    PERIODIC("Periodic", "Regular clicks every 1.5s"),
    FAST_RESPONSE("Fast Response", "Quick reaction clicks"),
    SLOW_STEADY("Slow Steady", "Careful, measured clicks"),
    ADAPTIVE("Adaptive", "Adapts based on game state")
}
