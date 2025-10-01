from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for and accept the alert dialog
    page.on("dialog", lambda dialog: dialog.accept())

    # Navigate to the frontend application
    page.goto("http://localhost:8000")

    # Set the input file for the file chooser
    with page.expect_file_chooser() as fc_info:
        page.locator("#imageLoader").click()
    file_chooser = fc_info.value
    # Use the absolute path to the file
    file_path = os.path.abspath("invalid_file.txt")
    file_chooser.set_files(file_path)

    # The application should show an alert, which is handled by the dialog listener.
    # We'll just wait for a moment to ensure the alert has time to appear.
    page.wait_for_timeout(2000)

    # Take a screenshot to show the state of the page after the alert.
    os.makedirs("jules-scratch/verification", exist_ok=True)
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as p:
    run(p)