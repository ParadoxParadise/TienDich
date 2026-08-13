from playwright.sync_api import sync_playwright
import time
import subprocess
import os
import sys

# Set stdout to utf-8 if possible, but let's just use ASCII
print("Starting HTTP server on port 8000...")
server_process = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], cwd=r"e:\Promt\novel-translator", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

print("Starting tests...")
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000")
    
    # TC01: Theme Toggle
    print("Test 1: Theme Toggle")
    is_dark = "dark-mode" in page.locator("body").get_attribute("class")
    page.click("#theme-toggle")
    time.sleep(0.5)
    is_light = "light-mode" in page.locator("body").get_attribute("class")
    if is_dark != is_light:
        print("[PASS] Test 1 (Theme Toggle)")
    else:
        print("[FAIL] Test 1")

    # TC02 & TC03: Settings Modal
    print("\nTest 2: Settings Modal & Tabs")
    page.click("#settings-toggle")
    time.sleep(0.5)
    modal_class = page.locator("#settings-modal").get_attribute("class")
    if "hidden" not in modal_class:
        print("[PASS] Test 2a (Modal opens)")
    else:
        print("[FAIL] Test 2a")
        
    page.click("button[data-tab='glossary-settings']")
    time.sleep(0.5)
    tab_class = page.locator("#glossary-settings").get_attribute("class")
    if "active" in tab_class:
        print("[PASS] Test 2b (Tab switch)")
    else:
        print("[FAIL] Test 2b")
        
    page.click("#close-modal")
    time.sleep(0.5)

    # TC05: Fake Source text injection & Vietphrase translate
    print("\nTest 3: Translating VietPhrase")
    # Wait for Vietphrase dictionary to load
    time.sleep(2) 
    page.evaluate('document.getElementById("source-text").innerText = "韩立";')
    page.click("#translate-btn")
    time.sleep(1)
    
    vp_text = page.locator("#vp-text").inner_text()
    print(f"   => VietPhrase output: '{vp_text}'")
    if "Han Lap" in vp_text or "Lập" in vp_text or "Lap" in vp_text or "Hàn Lập" in vp_text:
        print("[PASS] Test 3 (VietPhrase Offline)")
    else:
        print("[FAIL] Test 3 (Expected Han Lap)")

    # TC10-TC13: Highlighting & Popup
    print("\nTest 4: Highlighting and Popup Tool")
    page.evaluate('''
        const vpNode = document.querySelector("#vp-text p");
        if (vpNode) {
            const range = document.createRange();
            range.selectNodeContents(vpNode);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            
            // Dispatch mouseup to trigger the popup logic
            document.dispatchEvent(new MouseEvent('mouseup'));
        }
    ''')
    time.sleep(1)
    popup_class = page.locator("#selection-popup").get_attribute("class")
    if "hidden" not in popup_class:
        print("[PASS] Test 4a (Popup opens on select)")
    else:
        print("[FAIL] Test 4a")

    page.click("#open-name-modal-btn")
    time.sleep(0.5)
    name_modal_class = page.locator("#name-modal").get_attribute("class")
    if "hidden" not in name_modal_class:
        print("[PASS] Test 4b (Name Modal opens)")
        # Check if values are populated
        zh_val = page.locator("#name-zh").input_value()
        if "韩立" in zh_val:
            print("[PASS] Test 4c (Data synced to modal)")
        else:
            print("[FAIL] Test 4c")
            
        print("   => Saving new term: Han lao ma")
        page.locator("#name-vi").fill("Han lao ma")
        page.click("#save-name-btn")
        time.sleep(1)
        
        new_vp_text = page.locator("#vp-text").inner_text()
        print("   => New VietPhrase output checked")
        if "Han lao ma" in new_vp_text:
            print("[PASS] Test 4d (Replace & Glossary Save)")
        else:
            print("[FAIL] Test 4d")
    else:
        print("[FAIL] Test 4b")

    browser.close()

print("\nStopping HTTP server...")
server_process.kill()
print("All tests completed.")
