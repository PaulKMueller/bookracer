from typing import Union
import random
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # Which frontends can talk to the backend
    allow_credentials=True,
    allow_methods=["*"],             # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],             # Allow all headers
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/random_quote")
def random_quote() -> Union[dict, str]:
    # Read database and return a random highlight (and book title)
    import sqlite3
    DB_PATH = "highlights.db"
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT book_title, highlight FROM highlights ORDER BY RANDOM() LIMIT 1")
    row = cur.fetchone()
    conn.close()
    if row:
        book_title, highlight = row
        return {"book_title": book_title, "highlight": highlight}
    else:
        return {"message": "No highlights found"}

@app.get("/update_highlights")
def update_highlights() -> str:
    return "Highlights updated"