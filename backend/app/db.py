import sqlite3, json
from contextlib import contextmanager
from .config import DB_PATH

@contextmanager
def conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()

def init():
    with conn() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS predictions(
            id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, image_file TEXT,
            category TEXT NOT NULL, confidence REAL NOT NULL, probabilities TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')))""")

def row(r):
    d = dict(r)
    d["probabilities"] = json.loads(d["probabilities"])
    d["image_url"] = f"/uploads/{d['image_file']}"
    return d
