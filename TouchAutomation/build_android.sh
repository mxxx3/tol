#!/bin/bash

# Skrypt budowania aplikacji Android NEAT Game Bot
# Użyj tego skryptu w Android Studio Terminal lub z linii komend

echo "🤖 NEAT Game Bot - Android Build Script"
echo "======================================="

# Sprawdź czy jesteś w głównym folderze projektu
if [ ! -f "gradlew" ]; then
    echo "❌ Błąd: Nie znaleziono gradlew. Upewnij się, że jesteś w głównym folderze projektu."
    exit 1
fi

# Nadaj uprawnienia wykonywania dla gradlew
echo "📋 Ustawianie uprawnień dla Gradle Wrapper..."
chmod +x gradlew

# Wyczyść poprzednie buildy
echo "🧹 Czyszczenie poprzednich buildów..."
./gradlew clean

# Sprawdź konfigurację projektu
echo "🔍 Sprawdzanie konfiguracji projektu..."
./gradlew tasks --all | grep -E "(assembleDebug|installDebug)" || {
    echo "❌ Błąd konfiguracji Gradle. Sprawdź czy wszystkie pliki są na miejscu."
    exit 1
}

# Buduj aplikację
echo "🔨 Budowanie aplikacji (tryb debug)..."
./gradlew assembleDebug

# Sprawdź czy build się udał
if [ $? -eq 0 ]; then
    echo "✅ Kompilacja zakończona pomyślnie!"
    echo ""
    echo "📱 APK znajduje się w: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🚀 Instalacja na urządzeniu:"
    echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📋 Następne kroki:"
    echo "   1. Zainstaluj APK na urządzeniu Android"
    echo "   2. Włącz usługę dostępności w Ustawieniach"
    echo "   3. Nadaj uprawnienie wyświetlania nad innymi aplikacjami"
    echo "   4. Uruchom aplikację i ciesz się automatyzacją!"
else
    echo "❌ Kompilacja nie powiodła się. Sprawdź błędy powyżej."
    echo ""
    echo "🔧 Typowe rozwiązania:"
    echo "   - Sprawdź czy masz zainstalowane Android SDK"
    echo "   - Upewnij się, że ANDROID_HOME jest ustawione"
    echo "   - Sprawdź czy masz Android API 34"
    echo "   - Otwórz projekt w Android Studio i spróbuj Sync Project"
    exit 1
fi