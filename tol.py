
earned_toc_total = 0.0  # Globalna zmienna przechowująca sumę TOC
import os
import time
import cv2
import pyautogui
import pytesseract
import re
from PIL import Image
import pygetwindow as gw
import ctypes
import numpy as np
from datetime import datetime
import threading
import tkinter as tk
from tkinter import ttk
import json

# Ścieżka do katalogu wyjściowego
base_dir = os.path.dirname(os.path.abspath(__file__))
screen_dir = os.path.join(base_dir, "screen")
os.makedirs(screen_dir, exist_ok=True)

# Funkcja kliknięcia przycisku
def click_button(image_path, label):
    try:
        position = pyautogui.locateCenterOnScreen(image_path, confidence=0.8)
        if position:
            pyautogui.click(position)
            print(f"Kliknięto przycisk {label}.")
            time.sleep(0.5)  # Czekaj 1 sekundę po kliknięciu
        else:
            print(f"Nie znaleziono przycisku {label}.")
            print(f"Aktualny czas: {datetime.now().time()}")  # Log the current time whenever a button is not found
            return False
        return True
    except Exception as e:
        print(f"Błąd przy klikaniu przycisku {label}: {e}")
        return False

# Funkcja rozwiązywania zagadki matematycznej
def solve_math_problem(image):
    try:
        # Przetwarzanie obrazu dla OCR
        image = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        custom_oem_psm_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(image, config=custom_oem_psm_config)

        print(f"Rozpoznany tekst: {text}")

        # Szukaj równania matematycznego (np. "5 + 3")
        match = re.search(r"(\d+)\s*[+]\s*(\d+)", text)
        if match:
            num1, num2 = match.groups()
            result = int(num1) + int(num2)
            print(f"Rozwiązanie zagadki: {num1} + {num2} = {result}")
            return result
        else:
            print("Nie znaleziono równania matematycznego.")
            return None
    except Exception as e:
        print(f"Błąd podczas rozwiązywania zagadki: {e}")
        return None

# Funkcja liczenia gwiazdek
def count_stars(screenshot_path):
    try:
        template_path = os.path.join(screen_dir, "template_star.png")
        template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
        if template is None:
            raise FileNotFoundError(f"Nie znaleziono szablonu gwiazdek: {template_path}")

        screenshot = cv2.imread(screenshot_path, cv2.IMREAD_GRAYSCALE)
        if screenshot is None:
            raise FileNotFoundError(f"Nie znaleziono zrzutu ekranu: {screenshot_path}")

        template_h, template_w = template.shape[:2]

        # Dopasowanie wzorca
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        threshold = 0.75  # Obniżony próg zgodności
        locations = np.where(result >= threshold)

        # Lista do przechowywania znalezionych prostokątów
        rectangles = []
        for pt in zip(*locations[::-1]):
            rect = [pt[0], pt[1], template_w, template_h]
            rectangles.append(rect)

        # Grupowanie nakładających się prostokątów
        rectangles, weights = cv2.groupRectangles(rectangles, groupThreshold=1, eps=0.3)

        # Liczenie gwiazdek
        star_count = len(rectangles)
        print(f"Liczba gwiazdek: {star_count}")
        return star_count
    except Exception as e:
        print(f"Błąd przy liczeniu gwiazdek: {e}")
        return None
def znajdz_i_kliknij_x_skoncentrowany(screenshot_path, x_button_path):
    try:
        # Wczytaj zrzut ekranu
        screenshot = cv2.imread(screenshot_path, cv2.IMREAD_GRAYSCALE)
        if screenshot is None:
            print(f"[DEBUG] Nie udało się wczytać zrzutu ekranu: {screenshot_path}")
            return

        # Przytnij region do dolnej części okna (dla Verify Mining Activity)
        height, width = screenshot.shape
        cropped_region = screenshot[50:height, 0:width]  # Ignoruj górny pasek okna

        # Zapisz przycięty zrzut ekranu (do debugowania)
        cropped_path = os.path.join(screen_dir, "cropped_verify_region.png")
        cv2.imwrite(cropped_path, cropped_region)
        print(f"[DEBUG] Zapisano przycięty region do pliku: {cropped_path}")

        # Wczytaj szablon przycisku X
        x_button = cv2.imread(x_button_path, cv2.IMREAD_GRAYSCALE)
        if x_button is None:
            print(f"[DEBUG] Nie udało się wczytać obrazu przycisku X: {x_button_path}")
            return

        # Szukaj X w przyciętym regionie
        result = cv2.matchTemplate(cropped_region, x_button, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(result)

        # Sprawdź, czy znaleziono X z wystarczającą pewnością
        if max_val >= 0.8:  # Pewność 80%
            x, y = max_loc
            # Dodaj przesunięcie y, ponieważ region jest przycięty
            pyautogui.click(x + 10, y + 60)  # +60 przesunięcie od górnej krawędzi
            print(f"[DEBUG] Kliknięto przycisk X na współrzędnych ({x + 10}, {y + 60}).")
        else:
            print(f"[DEBUG] Nie znaleziono przycisku X z wystarczającą pewnością. Maksymalna wartość: {max_val:.2f}")
    except Exception as e:
        print(f"[DEBUG] Błąd podczas wyszukiwania i klikania przycisku X: {e}")

# Funkcja aktywacji okna
def activate_window(title):
    try:
        windows = gw.getWindowsWithTitle(title)
        if windows:
            hwnd = windows[0]._hWnd
            ctypes.windll.user32.ShowWindow(hwnd, 5)  # 5 = SW_SHOW
            ctypes.windll.user32.SetForegroundWindow(hwnd)  # Ustaw jako aktywne
            print(f"Okno '{title}' zostało aktywowane.")
            return True
        else:
            print(f"Nie znaleziono okna o tytule '{title}'.")
            return False
    except Exception as e:
        print(f"Błąd podczas aktywacji okna '{title}': {e}")
        return False
def find_window_by_click(click_position):
    """
    Znajduje okno aplikacji na podstawie współrzędnych kliknięcia.
    """
    for window in gw.getWindowsWithTitle("TOC - The Open Coin"):
        if window.left <= click_position[0] <= window.left + window.width and \
           window.top <= click_position[1] <= window.top + window.height:
            return window

    for window in gw.getWindowsWithTitle("Miniaplikacja: TOC - The Open Coin"):
        if window.left <= click_position[0] <= window.left + window.width and \
           window.top <= click_position[1] <= window.top + window.height:
            return window

    return None
    
# Główna funkcja
# Główna funkcja
def main():
    mine_button_path = os.path.join(screen_dir, "mine_button_image.png")
    got_it_button_path = os.path.join(screen_dir, "got_it_button_image.png")
    mine_more_button_path = os.path.join(screen_dir, "mine_more_button_image.png")
    verify_button_path = os.path.join(screen_dir, "verify.png")
    result_field_path = os.path.join(screen_dir, "result_field_image.png")
    error_text_path = os.path.join(screen_dir, "error_text_image.png")
    x_button_path = os.path.join(screen_dir, "x.png")

    while True:
        # Sprawdź, czy flaga zatrzymania jest ustawiona
        if app.stop_main:
            print("Zatrzymywanie funkcji main na czas przerwy...")
            break
            
        # Aktywuj okno TOC
        if not activate_window("TOC - The Open Coin") and not activate_window("Miniaplikacja: TOC - The Open Coin"):
            print("Nie udało się aktywować żadnego okna. Przerywam działanie funkcji main.")
            return

        # ✅ Szukaj przycisku "Mine More"
        if pyautogui.locateOnScreen(mine_more_button_path, confidence=0.8):
            print("✅ 'Mine More' znalezione, robimy zrzut ekranu przed kliknięciem...")

            # Pobierz okno TOC przed kliknięciem "Mine More"
            toc_window = find_window_by_name("TOC - The Open Coin")
            if toc_window:
                screenshot_path = os.path.join(screen_dir, "toc_screenshot.png")
                x, y, width, height = toc_window.left, toc_window.top, toc_window.width, toc_window.height
                screenshot = pyautogui.screenshot(region=(x, y, width, height))
                screenshot.save(screenshot_path)
                print(f"✅ Zrzut ekranu zapisany: {screenshot_path}")

            # Kliknij 'Mine More'
            print("⛏️ Kliknięto 'Mine More'. Restartowanie procesu.")
            time.sleep(2)
            
            # Zrób zrzut ekranu po kliknięciu
            if toc_window:
                pyautogui.screenshot(screenshot_path)
                extract_toc_earnings(screenshot_path, app)

            continue  # Restart pętli

        # 🔍 Jeśli NIE znaleziono "Mine More", sprawdzamy wszystkie możliwe blokery
        print("❌ 'Mine More' nie znalezione. Sprawdzamy, czy coś blokuje 'MINE'...")

        # 🔹 Lista przycisków, które blokują "MINE"
        blocking_buttons = [
            mine_more_button_path,  # ✅ "Mine More" traktujemy jako blokadę
            got_it_button_path,
            verify_button_path,
            result_field_path,
            error_text_path,
            x_button_path
        ]

        blocking_detected = False

        # 🔍 Szukamy KAŻDEGO z przycisków
        for button in blocking_buttons:
            if pyautogui.locateOnScreen(button, confidence=0.8):
                print(f"⛔ Wykryto {button}, NIE klikam 'MINE'.")
                blocking_detected = True
                break  # Jeśli wykryto JEDEN z nich, zatrzymujemy sprawdzanie

        # 🔥 Jeśli NIC NIE BLOKUJE, klikamy "MINE"
        if not blocking_detected:
            print("✅ Nic nie blokuje! Klikam 'MINE'...")
            if click_button(mine_button_path, "MINE"):
                print("✅ Kliknięto MINE, czekam na reakcję...")
                time.sleep(2)

                # Pobierz poprawne okno TOC po kliknięciu MINE
                mine_button_position = pyautogui.locateCenterOnScreen(mine_button_path, confidence=1)
                if mine_button_position:
                    toc_window = find_window_by_click(mine_button_position)

                if toc_window:
                    # Zrób zrzut ekranu po kliknięciu MINE
                    screenshot_path = os.path.join(screen_dir, "post_mine_click.png")
                    x, y, width, height = toc_window.left, toc_window.top, toc_window.width, toc_window.height
                    screenshot = pyautogui.screenshot(region=(x, y, width, height))
                    screenshot.save(screenshot_path)
                    print(f"✅ Zrzut ekranu zapisany: {screenshot_path}")
                else:
                    print("❌ Nie znaleziono poprawnego okna TOC po kliknięciu MINE.")
                    return



                # Sprawdź, co wyświetla okno: matematyka czy gwiazki
                img = cv2.imread(screenshot_path, cv2.IMREAD_GRAYSCALE)
                math_result = solve_math_problem(img)

            if math_result is not None:
                if click_button(result_field_path, "result field"):
                    print("Kliknięto pole 'result_field_image.png'.")
                    pyautogui.press('backspace')
                    pyautogui.press('backspace')
                    print("Kliknięcie Backspace dwa razy przed wpisaniem wyniku matematycznego.")
                    pyautogui.typewrite(str(math_result))
                    print("Wpisano rozwiązanie zagadki matematycznej w pole.")

                    # Kliknij przycisk "Verify"
                    if click_button(verify_button_path, "Verify"):
                        print("Kliknięto przycisk 'Verify'.")

                        # 📸 Zrób zrzut ekranu po kliknięciu "Verify"
                        screenshot_path = os.path.join(screen_dir, "post_verify_click.png")
                        if toc_window:
                            x, y, width, height = toc_window.left, toc_window.top, toc_window.width, toc_window.height
                            screenshot = pyautogui.screenshot(region=(x, y, width, height))
                            screenshot.save(screenshot_path)
                            print(f"✅ Zrzut ekranu po 'Verify' zapisany: {screenshot_path}")
                        else:
                            print("❌ Nie znaleziono poprawnego okna TOC po 'Verify'.")

                        # 📌 Sprawdź, czy pojawił się napis "Verification failed" za pomocą OCR
                        try:
                            img_color = cv2.imread(screenshot_path, cv2.IMREAD_COLOR)

                            # 📸 1. Konwersja obrazu do przestrzeni barw HSV
                            img_hsv = cv2.cvtColor(img_color, cv2.COLOR_BGR2HSV)

                            # 🔹 2. Filtr koloru czerwonego (zakres HSV dla czerwieni)
                            lower_red1 = np.array([0, 120, 70])    # Dolny próg czerwieni
                            upper_red1 = np.array([10, 255, 255])  # Górny próg czerwieni
                            lower_red2 = np.array([170, 120, 70])  # Drugi zakres czerwieni (bo czerwony występuje na końcu HSV)
                            upper_red2 = np.array([180, 255, 255])

                            # 🔍 3. Utworzenie maski dla czerwonego koloru
                            mask1 = cv2.inRange(img_hsv, lower_red1, upper_red1)
                            mask2 = cv2.inRange(img_hsv, lower_red2, upper_red2)
                            red_mask = mask1 + mask2  # Połączenie obu masek

                            # 📝 4. Nakładamy maskę na oryginalny obraz, by uzyskać tylko czerwony tekst
                            red_text = cv2.bitwise_and(img_color, img_color, mask=red_mask)

                            # 🔄 5. Konwersja do skali szarości dla OCR
                            red_text_gray = cv2.cvtColor(red_text, cv2.COLOR_BGR2GRAY)

                            # 🎯 6. Poprawienie jakości obrazu przed OCR
                            red_text_gray = cv2.threshold(red_text_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

                            # 📝 7. OCR - analiza tekstu
                            custom_oem_psm_config = r'--oem 3 --psm 6'
                            text_detected = pytesseract.image_to_string(red_text_gray, config=custom_oem_psm_config).strip()

                            # 🔍 LOGI DEBUGUJĄCE
                            print(f"[DEBUG] Wykryty tekst OCR:\n{text_detected}")

                            # 📂 8. Zapisz wynik OCR do pliku debugowego
                            ocr_debug_path = os.path.join(screen_dir, "ocr_debug_red.txt")
                            with open(ocr_debug_path, "w", encoding="utf-8") as file:
                                file.write(text_detected)
                            print(f"[DEBUG] Tekst OCR zapisany w: {ocr_debug_path}")

                            # 📸 9. Zapisz przetworzony obraz do debugowania
                            debug_screenshot_path = os.path.join(screen_dir, "debug_post_verify_click_red.png")
                            cv2.imwrite(debug_screenshot_path, red_text_gray)
                            print(f"[DEBUG] Zapisano debugowy screenshot: {debug_screenshot_path}")

                            # 🔴 Jeśli znaleziono "Verification failed", klikamy X
                            if any(keyword in text_detected.lower() for keyword in ["verification failed", "verfication failed", "failed"]):
                                print("❌ Wykryto błąd weryfikacji! Klikam w dolny X.")

                                # Debug: Współrzędne regionu do wyszukiwania X
                                x_button_region = (x + 315, y + 30, 40, 40)
                                print(f"[DEBUG] Region do wyszukiwania przycisku X: Left={x_button_region[0]}, Top={x_button_region[1]}, Width={x_button_region[2]}, Height={x_button_region[3]}")

                                # Zrób zrzut regionu debugowego
                                cropped_x_region_path = os.path.join(screen_dir, "cropped_x_region.png")
                                try:
                                    region_screenshot = pyautogui.screenshot(region=x_button_region)
                                    region_screenshot.save(cropped_x_region_path)
                                    print(f"[DEBUG] Zrzut ekranu regionu zapisany: {cropped_x_region_path}")
                                except Exception as e:
                                    print(f"[ERROR] Nie udało się zapisać zrzutu regionu: {e}")

                                # Szukaj przycisku X w ograniczonym regionie
                                time.sleep(0.5)
                                x_button_position = pyautogui.locateCenterOnScreen(
                                    x_button_path, region=x_button_region, confidence=0.7
                                )

                                if not x_button_position:
                                    print("🔴 Nie znaleziono X standardową metodą, próbuję obniżyć próg dopasowania...")
                                    x_button_position = pyautogui.locateCenterOnScreen(
                                        x_button_path, region=x_button_region, confidence=0.6
                                    )

                                if x_button_position:
                                    pyautogui.click(x_button_position)
                                    print(f"✅ Kliknięto przycisk X na współrzędnych {x_button_position}.")
                                    time.sleep(1)
                                else:
                                    print("❌ Nie znaleziono przycisku X w ograniczonym regionie.")
                                    print(f"📸 Zapisuję debugowy screenshot: {cropped_x_region_path}")
                                    region_screenshot = pyautogui.screenshot(region=x_button_region)
                                    region_screenshot.save(cropped_x_region_path)

                        except Exception as e:
                            print(f"[ERROR] Błąd podczas analizy tekstu OCR: {e}")



            else:
                star_count = count_stars(screenshot_path)
                if star_count is not None:
                    if click_button(result_field_path, "result field"):
                        print("Kliknięto pole 'result_field_image.png'.")
                        time.sleep(0.5)
                        pyautogui.press('backspace')
                        pyautogui.press('backspace')
                        print("Kliknięcie Backspace dwa razy przed wpisaniem liczby gwiazdek.")
                        pyautogui.typewrite(str(star_count))
                        print("Wpisano liczbę gwiazdek w pole.")

                        # Kliknij przycisk "Verify"
                        if click_button(verify_button_path, "Verify"):
                            print("Kliknięto przycisk 'Verify'.")

                            # 📸 Zrób zrzut ekranu po kliknięciu "Verify"
                            screenshot_path = os.path.join(screen_dir, "post_verify_click.png")
                            if toc_window:
                                x, y, width, height = toc_window.left, toc_window.top, toc_window.width, toc_window.height
                                screenshot = pyautogui.screenshot(region=(x, y, width, height))
                                screenshot.save(screenshot_path)
                                print(f"✅ Zrzut ekranu po 'Verify' zapisany: {screenshot_path}")
                            else:
                                print("❌ Nie znaleziono poprawnego okna TOC po 'Verify'.")

                            # 📌 Sprawdź, czy pojawił się napis "Verification failed" za pomocą OCR
                            try:
                                img_color = cv2.imread(screenshot_path, cv2.IMREAD_COLOR)

                                # 📸 1. Konwersja obrazu do przestrzeni barw HSV
                                img_hsv = cv2.cvtColor(img_color, cv2.COLOR_BGR2HSV)

                                # 🔹 2. Filtr koloru czerwonego (zakres HSV dla czerwieni)
                                lower_red1 = np.array([0, 120, 70])    # Dolny próg czerwieni
                                upper_red1 = np.array([10, 255, 255])  # Górny próg czerwieni
                                lower_red2 = np.array([170, 120, 70])  # Drugi zakres czerwieni (bo czerwony występuje na końcu HSV)
                                upper_red2 = np.array([180, 255, 255])

                                # 🔍 3. Utworzenie maski dla czerwonego koloru
                                mask1 = cv2.inRange(img_hsv, lower_red1, upper_red1)
                                mask2 = cv2.inRange(img_hsv, lower_red2, upper_red2)
                                red_mask = mask1 + mask2  # Połączenie obu masek

                                # 📝 4. Nakładamy maskę na oryginalny obraz, by uzyskać tylko czerwony tekst
                                red_text = cv2.bitwise_and(img_color, img_color, mask=red_mask)

                                # 🔄 5. Konwersja do skali szarości dla OCR
                                red_text_gray = cv2.cvtColor(red_text, cv2.COLOR_BGR2GRAY)

                                # 🎯 6. Poprawienie jakości obrazu przed OCR
                                red_text_gray = cv2.threshold(red_text_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

                                # 📝 7. OCR - analiza tekstu
                                custom_oem_psm_config = r'--oem 3 --psm 6'
                                text_detected = pytesseract.image_to_string(red_text_gray, config=custom_oem_psm_config).strip()

                                # 🔍 LOGI DEBUGUJĄCE
                                print(f"[DEBUG] Wykryty tekst OCR:\n{text_detected}")

                                # 📂 8. Zapisz wynik OCR do pliku debugowego
                                ocr_debug_path = os.path.join(screen_dir, "ocr_debug_red.txt")
                                with open(ocr_debug_path, "w", encoding="utf-8") as file:
                                    file.write(text_detected)
                                print(f"[DEBUG] Tekst OCR zapisany w: {ocr_debug_path}")

                                # 📸 9. Zapisz przetworzony obraz do debugowania
                                debug_screenshot_path = os.path.join(screen_dir, "debug_post_verify_click_red.png")
                                cv2.imwrite(debug_screenshot_path, red_text_gray)
                                print(f"[DEBUG] Zapisano debugowy screenshot: {debug_screenshot_path}")

                                # 🔴 Jeśli znaleziono "Verification failed", klikamy X
                                if any(keyword in text_detected.lower() for keyword in ["verification failed", "verfication failed", "failed"]):
                                    print("❌ Wykryto błąd weryfikacji! Klikam w dolny X.")

                                    # Debug: Współrzędne regionu do wyszukiwania X
                                    x_button_region = (x + 315, y + 30, 40, 40)
                                    print(f"[DEBUG] Region do wyszukiwania przycisku X: Left={x_button_region[0]}, Top={x_button_region[1]}, Width={x_button_region[2]}, Height={x_button_region[3]}")

                                    # Zrób zrzut regionu debugowego
                                    cropped_x_region_path = os.path.join(screen_dir, "cropped_x_region.png")
                                    try:
                                        region_screenshot = pyautogui.screenshot(region=x_button_region)
                                        region_screenshot.save(cropped_x_region_path)
                                        print(f"[DEBUG] Zrzut ekranu regionu zapisany: {cropped_x_region_path}")
                                    except Exception as e:
                                        print(f"[ERROR] Nie udało się zapisać zrzutu regionu: {e}")

                                    # Szukaj przycisku X w ograniczonym regionie
                                    time.sleep(0.5)
                                    x_button_position = pyautogui.locateCenterOnScreen(
                                        x_button_path, region=x_button_region, confidence=0.7
                                    )

                                    if not x_button_position:
                                        print("🔴 Nie znaleziono X standardową metodą, próbuję obniżyć próg dopasowania...")
                                        x_button_position = pyautogui.locateCenterOnScreen(
                                            x_button_path, region=x_button_region, confidence=0.6
                                        )

                                    if x_button_position:
                                        pyautogui.click(x_button_position)
                                        print(f"✅ Kliknięto przycisk X na współrzędnych {x_button_position}.")
                                        time.sleep(1)
                                    else:
                                        print("❌ Nie znaleziono przycisku X w ograniczonym regionie.")
                                        print(f"📸 Zapisuję debugowy screenshot: {cropped_x_region_path}")
                                        region_screenshot = pyautogui.screenshot(region=x_button_region)
                                        region_screenshot.save(cropped_x_region_path)

                            except Exception as e:
                                print(f"[ERROR] Błąd podczas analizy tekstu OCR: {e}")


                continue

            # 🛑 Jeśli nie znaleziono "MINE", sprawdzamy "Got It"
            print("Nie znaleziono 'MINE'. Szukanie przycisku 'Got It'...")
            if click_button(got_it_button_path, "Got It"):
                print("✅ Kliknięto 'Got It'.")
                continue

            # 🔄 Jeśli nie znaleziono nic, ponawiamy próbę
            print("❌ Nie znaleziono żadnego przycisku. Ponawianie próby...")





# Funkcja wątku do harmonogramu

def main_wrapper(app):
    try:
        while not app.stop_main:  # Flaga zatrzymania funkcji main
            main()  # Wywołaj oryginalną funkcję main
            time.sleep(0.1)  # Krótki odstęp, aby móc regularnie sprawdzać flagę
    except Exception as e:
        print(f"Błąd w funkcji main: {e}")



def main_task(app):
    try:
        print("Rozpoczęcie zadania w harmonogramie...")
        main_thread = None  # Wątek dla funkcji main
        while not app.stop_flag:
            if app.is_break_time():
                print("Przerwa aktywna! Wstrzymanie działania.")
                # Zatrzymaj działanie funkcji main, jeśli jest aktywna
                if main_thread and main_thread.is_alive():
                    app.stop_main = True  # Ustaw flagę zatrzymania
                    main_thread.join()  # Poczekaj na zakończenie wątku
                    print("Funkcja main została zatrzymana na czas przerwy.")
                # Trwaj w trybie przerwy
                while app.is_break_time() and not app.stop_flag:
                    print(f"Przerwa trwa... Aktualny czas: {datetime.now().time()}")
                    time.sleep(0.1)
                print("Przerwa zakończona. Wznawianie działania.")
            else:
                # Jeśli brak przerwy, uruchom `main` w nowym wątku
                if not (main_thread and main_thread.is_alive()):  # Uruchom, jeśli wątek nie działa
                    print("Brak przerwy. Uruchamianie funkcji main.")
                    app.stop_main = False  # Reset flagi zatrzymania
                    main_thread = threading.Thread(target=main_wrapper, args=(app,))
                    main_thread.start()
                time.sleep(0.1)  # Sprawdzaj czas przerwy co sekundę
    except Exception as e:
        print(f"Błąd w funkcji main_task: {e}")
    finally:
        print("Zakończono zadanie w harmonogramie.")

    try:
        print("Rozpoczęcie zadania w harmonogramie...")
        while not app.stop_flag:
            # Loguj czas na początku każdej iteracji
            current_time = datetime.now().time()
            print(f"Sprawdzanie przerwy... Aktualny czas: {current_time}")

            if app.is_break_time():
                print("Przerwa aktywna! Wstrzymanie działania.")
                while app.is_break_time() and not app.stop_flag:
                    print(f"Przerwa trwa... Aktualny czas: {datetime.now().time()}")
                    time.sleep(0.1)  # Regularne sprawdzanie
                print("Przerwa zakończona. Wznawianie działania.")
            else:
                # Wykonywanie krótkich fragmentów funkcji main() zamiast jednego dużego bloku
                print(f"Brak przerwy. Wykonywanie funkcji main na krótką chwilę.")
                cycle_start = datetime.now()
                while (datetime.now() - cycle_start).total_seconds() < 1:  # Wykonuj przez maks. 1 sekundę
                    time.sleep(0.1)  # Daj GUI czas na reakcję
    except Exception as e:
        print(f"Błąd w funkcji main_task: {e}")
    finally:
        print("Zakończono zadanie w harmonogramie.")

    try:
        print("Rozpoczęcie zadania w harmonogramie...")
        while not app.stop_flag:
            # Zawsze loguj aktualny czas w każdej iteracji
            current_time = datetime.now().time()
            print(f"Sprawdzanie przerwy... Aktualny czas: {current_time}")

            # Sprawdzenie, czy jest czas na przerwę
            if app.is_break_time():
                print("Przerwa aktywna! Wstrzymanie działania.")
                while app.is_break_time() and not app.stop_flag:
                    print(f"Przerwa trwa... Aktualny czas: {datetime.now().time()}")
                    time.sleep(0.1)  # Regularne sprawdzanie co sekundę
                print("Przerwa zakończona. Wznawianie działania.")
            else:
                # Jeśli nie jest czas na przerwę, loguj czas i wykonuj główną funkcję
                print(f"Brak przerwy. Aktualny czas: {current_time}. Wykonywanie funkcji main.")
                main()
                # Dodaj krótką przerwę, aby pętla mogła zaktualizować stan
                time.sleep(0.1)
    except Exception as e:
        print(f"Błąd w funkcji main_task: {e}")
    finally:
        print("Zakończono zadanie w harmonogramie.")

# Klasa GUI
class HarmonogramPrzerwApp:
    def __init__(self, root):
        self.earned_toc_total = 0.0  # Globalna zmienna przechowująca sumę TOC w GUI

        self.root = root
        self.root.title("Harmonogram Przerw")
        self.sesje = []
        self.przerwa_czestotliwosc = 0
        self.stop_flag = False
        self.stop_main = False  # Flaga zatrzymania funkcji main

        self.glowna_ramka = ttk.Frame(root, padding="10")
        self.glowna_ramka.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        self.dodaj_naglowek()
        self.dodaj_przyciski()
        self.dodaj_opcje_czestotliwosci()
        self.thread = None

        # Obsługa zamykania aplikacji
        self.root.protocol("WM_DELETE_WINDOW", self.zamknij_aplikacje)

        # Wczytaj ustawienia z pliku JSON
        self.wczytaj_ustawienia()
    def update_earned_toc(self):
        print(f"🔄 Aktualizacja GUI: {self.earned_toc_total:.2f} TOC")  # Debugowanie w konsoli
        self.earned_toc_label.config(text=f"Zarobione TOC: {self.earned_toc_total:.2f}")
        self.root.update_idletasks()  # Odświeżenie GUI natychmiastowe

        
    def zamknij_aplikacje(self):
        self.zapisz_ustawienia()
        self.root.destroy()



    def wstrzymaj_harmonogram(self):
        self.stop_main = True
        print("Harmonogram wstrzymany.")

    def dodaj_naglowek(self):
        naglowek = ttk.Label(self.glowna_ramka, text="Harmonogram Przerw", font=("Arial", 16, "bold"))
        naglowek.grid(row=0, column=0, columnspan=2, pady=(5, 5))  # Zmniejszono odstępy pionowe


    def dodaj_przyciski(self):
        # Przycisk Dodaj sesję
        przycisk_sesji = ttk.Button(self.glowna_ramka, text="Dodaj przerwy", command=self.dodaj_sesje)
        przycisk_sesji.grid(row=1, column=0, sticky=tk.W, pady=(0, 5))  # Zmniejszono odstęp na dole

        # Przycisk Save
        przycisk_save = ttk.Button(self.glowna_ramka, text="Zapisz", command=self.zapisz_ustawienia)
        przycisk_save.grid(row=2, column=0, sticky=tk.W, pady=(0, 5))  # Zmniejszono odstęp na dole

        # Przycisk Rozpocznij Harmonogram
        przycisk_rozpocznij = ttk.Button(self.glowna_ramka, text="Uruchom Clicker", command=self.rozpocznij_harmonogram)
        przycisk_rozpocznij.grid(row=1, column=1, sticky=tk.E, padx=(5, 0))  # Dodano odstęp po lewej

        # 🔹 Etykieta do wyświetlania sumy TOC (dodana pod przyciskiem "Uruchom Clicker")
        self.earned_toc_label = tk.Label(self.glowna_ramka, text="Zarobione TOC: 0.00", font=("Arial", 12), bg="white", fg="black")
        self.earned_toc_label.grid(row=3, column=0, columnspan=2, pady=10)  # Ustawienie pod przyciskiem



    def zapisz_ustawienia(self):
        ustawienia = {
            "czestotliwosc_przerwy": self.czestotliwosc_var.get(),
            "sesje": [
                {
                    "start": f"{start_hour.get()}:{start_minute.get()}",
                    "stop": f"{stop_hour.get()}:{stop_minute.get()}"
                }
                for _, start_hour, start_minute, stop_hour, stop_minute in self.sesje
            ]
        }
        with open("ustawienia.json", "w") as plik:
            json.dump(ustawienia, plik, indent=4)
        print("Ustawienia zapisane do pliku ustawienia.json")
    
    def dodaj_opcje_czestotliwosci(self):
        opcje_label = ttk.Label(self.glowna_ramka, text="Częstotliwość przerwy:")
        opcje_label.grid(row=4, column=0, columnspan=2, sticky=tk.W, pady=(20, 5))  # Zwiększony odstęp od góry

        self.czestotliwosc_var = tk.StringVar(value="Brak")
        opcje = [("Brak", 0), ("Przerwa co 10 minut", 10), ("Przerwa co 20 minut", 20), 
                 ("Przerwa co 30 minut", 30), ("Przerwa co godzinę", 60)]

        for i, (tekst, wartosc) in enumerate(opcje):
            radio = ttk.Radiobutton(self.glowna_ramka, text=tekst, variable=self.czestotliwosc_var, value=wartosc)
            radio.grid(row=5 + i, column=0, columnspan=2, sticky=tk.W)  # Rozpoczynamy od wiersza 4


    def ustaw_czestotliwosc(self):
        self.przerwa_czestotliwosc = int(self.czestotliwosc_var.get())
        print(f"Wybrano przerwę co {self.przerwa_czestotliwosc} minut.")

    def dodaj_sesje(self, start_hour_value="00", start_minute_value="00", stop_hour_value="00", stop_minute_value="00"):
        ramka_sesji = ttk.Frame(self.glowna_ramka, padding="5", relief="ridge")
        ramka_sesji.grid(sticky=(tk.W, tk.E), pady=(5, 0))

        start_label = ttk.Label(ramka_sesji, text="Początek:")
        start_label.grid(row=0, column=0)

        start_hour = ttk.Combobox(ramka_sesji, width=5, values=[f"{i:02}" for i in range(24)])
        start_hour.set(start_hour_value)
        start_hour.grid(row=0, column=1)

        start_minute = ttk.Combobox(ramka_sesji, width=5, values=[f"{i:02}" for i in range(60)])
        start_minute.set(start_minute_value)
        start_minute.grid(row=0, column=2)

        stop_label = ttk.Label(ramka_sesji, text="Koniec:")
        stop_label.grid(row=0, column=3)

        stop_hour = ttk.Combobox(ramka_sesji, width=5, values=[f"{i:02}" for i in range(24)])
        stop_hour.set(stop_hour_value)
        stop_hour.grid(row=0, column=4)

        stop_minute = ttk.Combobox(ramka_sesji, width=5, values=[f"{i:02}" for i in range(60)])
        stop_minute.set(stop_minute_value)
        stop_minute.grid(row=0, column=5)

        remove_button = ttk.Button(ramka_sesji, text="Usuń", command=lambda: self.usun_sesje(ramka_sesji))
        remove_button.grid(row=0, column=6)

        self.sesje.append((ramka_sesji, start_hour, start_minute, stop_hour, stop_minute))

        # Zapisz ustawienia po dodaniu sesji
        self.zapisz_ustawienia()
    
    def usun_sesje(self, ramka_sesji):
        for sesja in self.sesje:
            if sesja[0] == ramka_sesji:
                self.sesje.remove(sesja)
                break
        ramka_sesji.destroy()

    def is_break_time(self):
        current_time = datetime.now().time().replace(microsecond=0)  # Usuń mikrosekundy

        for _, start_hour, start_minute, stop_hour, stop_minute in self.sesje:
            try:
                start_time = datetime.strptime(f"{start_hour.get()}:{start_minute.get()}", "%H:%M").time()
                stop_time = datetime.strptime(f"{stop_hour.get()}:{stop_minute.get()}", "%H:%M").time()
                if start_time <= stop_time:  # Przerwa w tym samym dniu
                    if start_time <= current_time <= stop_time:
                        print(f"Przerwa aktywna: {start_time} - {stop_time}")  # Debug
                        return True
                else:  # Przerwa obejmuje północ
                    if current_time >= start_time or current_time <= stop_time:
                        print(f"Przerwa aktywna (przez północ): {start_time} - {stop_time}")  # Debug
                        return True
            except Exception as e:
                print(f"Błąd w sprawdzaniu czasu przerwy: {e}")

        return False

    def wczytaj_ustawienia(self):
        try:
            if os.path.exists("ustawienia.json"):
                with open("ustawienia.json", "r") as plik:
                    ustawienia = json.load(plik)
                    print("Wczytano ustawienia z pliku ustawienia.json")

                    # Ustaw częstotliwość przerwy
                    self.czestotliwosc_var.set(ustawienia.get("czestotliwosc_przerwy", "Brak"))

                    # Dodaj zapisane sesje
                    for sesja in ustawienia.get("sesje", []):
                        start, stop = sesja.get("start", "00:00"), sesja.get("stop", "00:00")
                        start_hour, start_minute = start.split(":")
                        stop_hour, stop_minute = stop.split(":")
                        self.dodaj_sesje(start_hour, start_minute, stop_hour, stop_minute)
        except Exception as e:
            print(f"Błąd podczas wczytywania ustawień: {e}")
        
    def rozpocznij_harmonogram(self):
        if self.thread is None or not self.thread.is_alive():
            self.stop_flag = False
            self.thread = threading.Thread(target=main_task, args=(self,), daemon=True)
            self.thread.start()
            print("Harmonogram uruchomiony.")

    def zatrzymaj_harmonogram(self):
        self.stop_flag = True
        if self.thread:
            self.thread.join()
        print("Harmonogram zatrzymany.")

def extract_toc_earnings(screenshot_path, app):
    try:
        # Przetwarzanie obrazu na tekst
        text = pytesseract.image_to_string(screenshot_path, config='--oem 3 --psm 6')
        
        # Znalezienie wartości TOC w tekście (np. "You earned 0.10 TOC")
        match = re.search(r"You earned ([\d.]+) TOC", text)
        if match:
            earned_toc = float(match.group(1))
            app.earned_toc_total += earned_toc  # ⬅️ Teraz TOC jest zapisywane w aplikacji (GUI)
            print(f"🎉 Dodano {earned_toc} TOC, nowe saldo: {app.earned_toc_total} TOC")
            
            # Aktualizacja GUI
            app.update_earned_toc()  # ⬅️ Aktualizujemy etykietę TOC w GUI
            return earned_toc
        else:
            print("⚠️ Nie znaleziono informacji o nagrodzie TOC")
            return 0.0
    except Exception as e:
        print(f"❌ Błąd OCR: {e}")
        return 0.0
        
if __name__ == "__main__":
    root = tk.Tk()
    app = HarmonogramPrzerwApp(root)
    root.mainloop()


