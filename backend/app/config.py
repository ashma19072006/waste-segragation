from pathlib import Path
BASE = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE / "models" / "waste_model.keras"
CLASSES_PATH = BASE / "models" / "class_names.json"
UPLOAD_DIR = BASE / "uploads"
DB_PATH = BASE / "waste.db"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
IMG_SIZE = 224
ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
