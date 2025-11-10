# kindle_scrape.py
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import sqlite3
import time
import os

DB_PATH = "highlights.db"
PROFILE_DIR = os.path.expanduser("~/.bookracer_playwright")  # persistent profile

def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_title TEXT,
        highlight TEXT,
        meta TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_title, highlight)
    )
    """)
    conn.commit()
    conn.close()

def save_highlight(book_title, highlight, meta):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT OR IGNORE INTO highlights (book_title, highlight, meta) VALUES (?, ?, ?)",
            (book_title, highlight, meta)
        )
        conn.commit()
    finally:
        conn.close()

def parse_notebook_html(html):
    soup = BeautifulSoup(html, "html.parser")

    # Highlights are <span id="highlight"> — non-unique IDs, so use find_all
    entries = soup.find_all("span", id="highlight")
    print(f"Found {len(entries)} highlights")

    results = []
    for e in entries:
        # Extract highlight text
        highlight_text = e.get_text(strip=True)

        # Find nearest book title above (if available)
        # Titles are often in <h3> or <div> near highlights
        book_title_el = e.find_previous(["h2", "h3", "div"], class_=lambda c: c and "book" in c.lower())
        title = book_title_el.get_text(strip=True) if book_title_el else "Unknown"

        # Optional: metadata (location, date, etc.)
        meta_el = e.find_next("div", class_=lambda c: c and "metadata" in c.lower())
        meta = meta_el.get_text(strip=True) if meta_el else ""

        results.append((title, highlight_text, meta))

    return results

def main():
    ensure_db()
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(user_data_dir=PROFILE_DIR, headless=False)
        page = browser.new_page()

        # Navigate to the notebook page — the user may be redirected to login.
        page.goto("https://read.amazon.com/notebook", wait_until="networkidle")

        # Check if login is needed: look for common element only visible after login
        if "Sign in" in page.title() or "Sign in" in page.content():
            print("Please sign in in the opened browser window. Waiting for you...")
            # Wait for the user to complete login and be redirected
            # You can wait until a known element on the notebook page exists
            page.wait_for_selector("span.highlight", timeout=0)  # wait indefinitely
        else:
            print("Already logged in — fetching highlights...")

        time.sleep(1)  # safety delay for dynamic content
        html = page.content()

        highlights = parse_notebook_html(html)
        print(f"Found {len(highlights)} highlights (parsed) — saving to DB...")
        for title, hl_text, meta in highlights:
            save_highlight(title, hl_text, meta)

        print("Saved highlights. Close the browser when you are done.")
        # Keep browser open if you want; otherwise:
        browser.close()

if __name__ == "__main__":
    main()