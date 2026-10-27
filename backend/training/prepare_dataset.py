"""Split dataset/raw/<class>/*.jpg into dataset/{train,val,test}/<class>. Run from the project root."""
import random, shutil, sys
from pathlib import Path

CLASSES = ["plastic", "paper", "glass", "metal", "organic", "trash"]
MAX_PER_CLASS = 600  # caps big classes so the model is not biased toward them
ROOT = Path(__file__).resolve().parents[2] / "dataset"
RAW = ROOT / "raw"
EXT = {".jpg", ".jpeg", ".png", ".webp"}

present = {d.name for d in RAW.iterdir() if d.is_dir()} if RAW.exists() else set()
if "cardboard" in present:
    print("NOTE: 'cardboard' folder found. It is NOT renamed to 'organic'. "
          "You may merge it into 'paper' yourself if appropriate.")

missing = [c for c in CLASSES if c not in present or not any(p.suffix.lower() in EXT for p in (RAW / c).glob("*"))]
if missing:
    sys.exit(f"Missing/empty class folders in {RAW}: {missing}\n"
             "Add real, correctly labelled images (150+ per class recommended). Nothing was prepared.")

for s in ("train", "val", "test"):
    shutil.rmtree(ROOT / s, ignore_errors=True)

random.seed(42)
for c in CLASSES:
    files = sorted(p for p in (RAW / c).iterdir() if p.suffix.lower() in EXT)
    total = len(files)
    random.shuffle(files)
    files = files[:MAX_PER_CLASS]
    n = len(files)
    a, b = int(0.7 * n), int(0.85 * n)
    for split, part in (("train", files[:a]), ("val", files[a:b]), ("test", files[b:])):
        d = ROOT / split / c
        d.mkdir(parents=True)
        for f in part:
            shutil.copy2(f, d / f.name)
    print(f"{c}: {total} found, {n} used -> train {a} / val {b - a} / test {n - b}")