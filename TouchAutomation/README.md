# NEAT Game Bot - Android

A native Android application built with Kotlin that automates game interactions using accessibility services. The app features a portrait-oriented internal browser and advanced touch automation capabilities.

## Features

### 🤖 Automated Bot System
- **Accessibility Touch**: Uses Android's AccessibilityService for real screen touches
- **Multiple Strategies**: Periodic, Fast Response, Slow Steady, and Adaptive timing patterns
- **Smart Retry Logic**: Automatic retry with error handling for failed gestures
- **Real-time Statistics**: Live tracking of clicks, scores, success rates

### 📱 Portrait-Optimized Interface
- **Internal WebView**: Portrait-oriented browser with game optimization
- **Material Design 3**: Modern dark theme with responsive layout
- **Overlay Controls**: Floating controls that work during gameplay
- **Permission Management**: Automated setup for accessibility and overlay permissions

### 🎮 Game Integration
- **Target Platform**: Optimized for ppkas.com games
- **Game State Detection**: JavaScript and accessibility tree analysis
- **Score Tracking**: Automatic score detection and performance monitoring
- **Activity Logging**: Detailed logs for debugging and monitoring

## Android Project Structure

```
app/
├── src/main/
│   ├── java/com/neatgamebot/
│   │   ├── MainActivity.kt                    # Main app interface
│   │   ├── models/
│   │   │   ├── BotStrategy.kt                # Strategy enum definitions
│   │   │   └── GameStats.kt                  # Statistics data model
│   │   ├── services/
│   │   │   ├── GameBotAccessibilityService.kt # Core accessibility service
│   │   │   └── OverlayService.kt             # Floating overlay controls
│   │   └── utils/
│   │       ├── WebViewHelper.kt              # WebView configuration
│   │       └── PermissionHelper.kt           # Permission management
│   ├── res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml             # Main UI layout
│   │   │   └── overlay_controls.xml          # Overlay layout
│   │   ├── values/
│   │   │   ├── colors.xml                    # Dark theme colors
│   │   │   ├── strings.xml                   # App strings
│   │   │   └── themes.xml                    # Material Design theme
│   │   ├── drawable/                         # UI backgrounds & icons
│   │   └── xml/
│   │       └── accessibility_service_config.xml # Accessibility settings
│   └── AndroidManifest.xml                   # App permissions & services
├── build.gradle                              # App dependencies
└── proguard-rules.pro                        # Build optimization
```

## Key Components

### MainActivity.kt
- Main user interface with Material Design components
- WebView integration with portrait orientation
- Bot controls (start/stop/test)
- Real-time statistics display
- Activity logging system

### GameBotAccessibilityService.kt
- Core automation service using AccessibilityService
- Touch gesture generation with retry logic
- Game state detection through accessibility tree
- Multiple bot strategies with adaptive timing
- Coroutine-based automation loop

### OverlayService.kt
- Floating controls that work during gameplay
- Foreground service with persistent notification
- Quick access to stop/test bot functions
- Real-time status updates

## Bot Strategies

1. **Periodic** (1500ms): Regular, consistent clicking
2. **Fast Response** (800ms): Quick reaction for fast-paced games
3. **Slow Steady** (2200ms): Careful, measured interactions
4. **Adaptive** (1000-1800ms): Adjusts timing based on success rate

## Setup Instructions

### Prerequisites
- Android Studio Arctic Fox or newer
- Android SDK 24+ (API level 24)
- Kotlin 1.9.20+
- Target device with Android 7.0+

### Build Steps
1. Open project in Android Studio
2. Sync Gradle dependencies
3. Connect Android device or start emulator
4. Build and install APK
5. Grant accessibility and overlay permissions

### Required Permissions
- `SYSTEM_ALERT_WINDOW`: Overlay controls
- `BIND_ACCESSIBILITY_SERVICE`: Touch automation
- `INTERNET`: Web game access
- `FOREGROUND_SERVICE`: Persistent operation

## Usage

1. **Launch App**: Open NEAT Game Bot
2. **Enter URL**: Input game URL (default: ppkas.com)
3. **Select Strategy**: Choose automation approach
4. **Grant Permissions**: Enable accessibility service when prompted
5. **Start Bot**: Tap "Start Bot" to begin automation
6. **Monitor**: Watch statistics and activity log
7. **Use Overlay**: Access floating controls during gameplay

## Technical Details

### Touch System
- Uses `GestureDescription` for precise touch events
- Center-screen targeting with configurable coordinates
- 100ms touch duration for reliable interaction
- Automatic retry on gesture cancellation

### Game Detection
- JavaScript injection for web-based score detection
- Accessibility tree analysis for UI state
- Pattern matching for game over/restart conditions
- Real-time score tracking and validation

### Performance Optimization
- Portrait-only WebView configuration
- Single-column layout algorithm
- Disabled zoom controls for consistency
- Optimized touch timing for minimal CPU usage

## Troubleshooting

### Common Issues
1. **Touch Not Working**: Ensure accessibility service is enabled in Settings
2. **Overlay Not Appearing**: Grant "Display over other apps" permission
3. **Game Not Loading**: Check internet connection and URL
4. **Bot Stopping**: Verify foreground service permission

### Debug Features
- Real-time activity logging
- Touch gesture completion tracking
- Game state detection logs
- Performance statistics

## Development

### Building from Source
```bash
# Clone and build
git clone <repository>
cd neat-game-bot-android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Key Classes to Modify
- `BotStrategy.kt`: Add new automation patterns
- `GameBotAccessibilityService.kt`: Modify touch behavior
- `WebViewHelper.kt`: Adjust browser settings
- `MainActivity.kt`: UI and control logic

## License

This project is for educational purposes. Ensure compliance with game terms of service when using automation features.