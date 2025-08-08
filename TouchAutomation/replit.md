# Overview

This is a native Android application built with Kotlin that serves as a game automation bot using accessibility services. The app provides a portrait-oriented internal WebView browser to interact with web-based games (specifically targeting ppkas.com) and includes automated touch interactions through Android's accessibility system. The application features multiple bot strategies, real-time statistics tracking, overlay controls, and a comprehensive dashboard interface to monitor bot performance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Android Native Architecture
- **Framework**: Native Android application built with Kotlin
- **UI Components**: Material Design 3 components with dark theme
- **State Management**: Android ViewModels and LiveData patterns
- **WebView Integration**: Android WebView with portrait orientation optimization and JavaScript injection
- **Accessibility Services**: Custom AccessibilityService for automated touch interactions
- **Portrait Layout**: Optimized for mobile portrait orientation with responsive design

## Bot Automation System
- **Accessibility Touch**: Uses Android's AccessibilityService to perform real screen touches
- **Strategy Pattern**: Multiple bot strategies (Periodic, Fast Response, Slow Steady, Adaptive) with configurable timing
- **Touch Gesture System**: GestureDescription-based touch events with retry logic
- **Statistics Tracking**: Real-time monitoring of bot performance metrics including clicks, scores, attempts, and success rates
- **Game State Detection**: Accessibility tree analysis and JavaScript-based game state monitoring

## Android-Specific Features
- **Overlay Service**: Floating overlay controls for bot management during gameplay
- **Foreground Service**: Persistent service with notification for continuous bot operation
- **Permission Management**: Automated permission requests for overlay and accessibility services
- **Material Design**: Modern Android UI with custom themes and drawable resources

## Build System
- **Android Gradle Plugin**: Standard Android Studio project structure
- **Kotlin**: Primary development language with coroutines support
- **Material Components**: Google's Material Design component library
- **Target SDK 34**: Latest Android features and security requirements

# External Dependencies

## Core Android Dependencies
- **AndroidX Core**: Modern Android development components and compatibility libraries
- **Material Design Components**: Google's Material Design 3 component library for modern UI
- **Kotlin Coroutines**: Asynchronous programming and concurrency handling
- **AndroidX Lifecycle**: ViewModel and LiveData for robust state management

## Android System Services
- **AccessibilityService**: Core service enabling automated touch interactions throughout the system
- **WindowManager**: Overlay service management for floating controls
- **NotificationManager**: Persistent notifications for foreground service operation

## Development Tools
- **Android Gradle Plugin 8.2.0**: Latest Android build system
- **Kotlin 1.9.20**: Modern, safe programming language for Android
- **Android SDK 34**: Latest Android platform features and APIs

## External Services
- **Web Game Targets**: Integration with browser-based games (ppkas.com) through optimized WebView
- **Accessibility Framework**: Deep integration with Android's accessibility system for precise touch control
- **No Backend Services**: Operates as a standalone Android application with local state management