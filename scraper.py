# kindle_scrape.py
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import sqlite3
import time
import os

DB_PATH = "highlights.db"
PROFILE_DIR = os.path.expanduser("~/.bookracer_playwright")  # persistent profile

# --- Database setup ---
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

# --- Parsing logic ---
def parse_notebook_html(html, book_title):
    soup = BeautifulSoup(html, "html.parser")
    entries = soup.find_all("span", id="highlight")
    results = []
    for e in entries:
        text = e.get_text(strip=True)
        # Find metadata (location, date, etc.)
        meta_el = e.find_previous("div", class_=lambda c: c and "highlight" in c.lower())
        meta = meta_el.get_text(strip=True) if meta_el else ""
        results.append((book_title, text, meta))
    return results


# --- Main scraping logic ---
def main():
    ensure_db()
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(user_data_dir=PROFILE_DIR, headless=False)
        page = browser.new_page()

        print("Opening Kindle Notebook...")
        page.goto("https://read.amazon.com/notebook", wait_until="networkidle")

        # Check if login is needed
        if "Sign in" in page.title() or "Sign in" in page.content():
            print("Please sign in in the opened browser window. Waiting for you...")
            page.wait_for_selector("span#highlight", timeout=0)  # wait indefinitely
        else:
            print("Already logged in — fetching highlights...")

        # Wait until sidebar with books loads
        page.wait_for_selector("div.kp-notebook-library-each-book, div.a-row.a-spacing-none")
        time.sleep(1)

        # Find all clickable books
        book_elements = page.query_selector_all("div.kp-notebook-library-each-book, div.a-row.a-spacing-none")
        print(f"Found {len(book_elements)} books in sidebar.")

        for i, book in enumerate(book_elements):
            try:
                title = book.inner_text().split("\n")[0].strip()
                print(f"\n📖 Scraping book {i+1}/{len(book_elements)}: {title}")

                # Click the book to load highlights
                book.click()
                page.wait_for_selector("span#highlight", timeout=10000)
                time.sleep(2)

                # Extract and parse HTML
                html = page.content()
                highlights = parse_notebook_html(html, title)
                print(f"  → Found {len(highlights)} highlights")

                for _, hl_text, meta in highlights:
                    save_highlight(title, hl_text, meta)

            except Exception as e:
                print(f"⚠️ Error scraping {title}: {e}")

        print("\n✅ Done. All highlights saved.")
        browser.close()


if __name__ == "__main__":
    main()