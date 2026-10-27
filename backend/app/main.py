import io, json, uuid
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from . import db
from .config import *
from .categories import CATEGORIES, CLASSES, NOTE
from .services.classifier import classifier

UPLOAD_DIR.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app):
    db.init()
    classifier.load()
    yield

app = FastAPI(title="Smart Waste AI", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
EXT = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}

def rec_info(cat):
    c = CATEGORIES[cat]
    return {k: c[k] for k in ("name", "bin", "recyclable", "description", "tips")} | {"note": NOTE}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": classifier.ready, "classes": classifier.classes,
            "message": None if classifier.ready else classifier.error}

@app.get("/categories")
def categories():
    return {"categories": CATEGORIES, "note": NOTE}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not classifier.ready:
        raise HTTPException(503, classifier.error or "Model unavailable")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image exceeds 8 MB limit")
    try:
        img = Image.open(io.BytesIO(data)); fmt = img.format; img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "File is not a valid image")
    if fmt not in ALLOWED_FORMATS:
        raise HTTPException(400, "Only JPG, PNG and WEBP images are supported")
    probs = classifier.predict(img)
    cat = max(probs, key=probs.get)
    name = f"{uuid.uuid4().hex}.{EXT[fmt]}"
    (UPLOAD_DIR / name).write_bytes(data)
    safe_orig = Path(file.filename or "image").name[:100]
    with db.conn() as c:
        cur = c.execute("INSERT INTO predictions(filename,image_file,category,confidence,probabilities) VALUES(?,?,?,?,?)",
                        (safe_orig, name, cat, probs[cat], json.dumps(probs)))
        rid = cur.lastrowid
    return {"id": rid, "category": cat, "confidence": probs[cat], "probabilities": probs,
            "recommendation": rec_info(cat), "image_url": f"/uploads/{name}"}

@app.get("/history")
def history(category: str | None = None, search: str | None = None, sort: str = "newest",
            page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
    where, args = [], []
    if category:
        if category not in CLASSES: raise HTTPException(400, "Unknown category")
        where.append("category=?"); args.append(category)
    if search:
        where.append("filename LIKE ?"); args.append(f"%{search}%")
    w = ("WHERE " + " AND ".join(where)) if where else ""
    order = {"newest": "id DESC", "oldest": "id ASC", "confidence": "confidence DESC"}.get(sort, "id DESC")
    with db.conn() as c:
        total = c.execute(f"SELECT COUNT(*) FROM predictions {w}", args).fetchone()[0]
        rows = c.execute(f"SELECT * FROM predictions {w} ORDER BY {order} LIMIT ? OFFSET ?",
                         args + [page_size, (page - 1) * page_size]).fetchall()
    return {"total": total, "page": page, "page_size": page_size, "items": [db.row(r) for r in rows]}

@app.get("/history/{rid}")
def one(rid: int):
    with db.conn() as c:
        r = c.execute("SELECT * FROM predictions WHERE id=?", (rid,)).fetchone()
    if not r: raise HTTPException(404, "Record not found")
    return db.row(r) | {"recommendation": rec_info(r["category"])}

def _rm(f): (UPLOAD_DIR / f).unlink(missing_ok=True)

@app.delete("/history/{rid}")
def delete_one(rid: int):
    with db.conn() as c:
        r = c.execute("SELECT image_file FROM predictions WHERE id=?", (rid,)).fetchone()
        if not r: raise HTTPException(404, "Record not found")
        c.execute("DELETE FROM predictions WHERE id=?", (rid,))
    _rm(r["image_file"])
    return {"deleted": rid}

@app.delete("/history")
def clear():
    with db.conn() as c:
        files = [r[0] for r in c.execute("SELECT image_file FROM predictions")]
        c.execute("DELETE FROM predictions")
    for f in files: _rm(f)
    return {"deleted": len(files)}

@app.get("/analytics")
def analytics(start: str | None = None, end: str | None = None):
    where, args = [], []
    if start: where.append("date(created_at)>=?"); args.append(start)
    if end: where.append("date(created_at)<=?"); args.append(end)
    w = ("WHERE " + " AND ".join(where)) if where else ""
    with db.conn() as c:
        counts = {k: 0 for k in CLASSES}
        for r in c.execute(f"SELECT category, COUNT(*) n FROM predictions {w} GROUP BY category", args):
            counts[r["category"]] = r["n"]
        total = sum(counts.values())
        avg = c.execute(f"SELECT AVG(confidence) FROM predictions {w}", args).fetchone()[0] or 0.0
        daily = [dict(r) for r in c.execute(
            f"SELECT date(created_at) date, COUNT(*) count FROM predictions {w} GROUP BY date(created_at) ORDER BY date", args)]
        recent = [db.row(r) for r in c.execute(f"SELECT * FROM predictions {w} ORDER BY id DESC LIMIT 10", args)]
    return {"total": total, "counts": counts,
            "percentages": {k: round(100 * v / total, 1) if total else 0.0 for k, v in counts.items()},
            "average_confidence": avg, "daily": daily, "recent": recent}
