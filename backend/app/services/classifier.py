import json
import numpy as np
from PIL import Image
from ..config import MODEL_PATH, CLASSES_PATH, IMG_SIZE
from ..categories import CLASSES

class Classifier:
    def __init__(self):
        self.model = None
        self.classes = CLASSES
        self.error = None

    def load(self):
        if not MODEL_PATH.exists() or not CLASSES_PATH.exists():
            self.error = ("Model not found. Prepare the dataset and run training: "
                          "python training/train.py (see README).")
            return
        try:
            import tensorflow as tf
            self.model = tf.keras.models.load_model(MODEL_PATH)
            self.classes = json.loads(CLASSES_PATH.read_text())
            if sorted(self.classes) != sorted(CLASSES):
                self.model, self.error = None, f"Model classes {self.classes} do not match required {CLASSES}."
        except Exception as e:
            self.model, self.error = None, f"Failed to load model: {e}"

    @property
    def ready(self):
        return self.model is not None

    def predict(self, img: Image.Image) -> dict:
        # Resize only: MobileNetV2 preprocessing is baked into the saved model,
        # so training and inference are identical.
        x = np.asarray(img.convert("RGB").resize((IMG_SIZE, IMG_SIZE)), dtype="float32")[None]
        probs = self.model.predict(x, verbose=0)[0]
        return {c: float(p) for c, p in zip(self.classes, probs)}

classifier = Classifier()
