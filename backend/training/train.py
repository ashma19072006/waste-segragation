"""Train MobileNetV2 (transfer learning) and evaluate on the held-out test set."""
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
tf.keras.config.disable_traceback_filtering()
from sklearn.metrics import classification_report, confusion_matrix

CLASSES = ["plastic", "paper", "glass", "metal", "organic", "trash"]
ROOT = Path(__file__).resolve().parents[2] / "dataset"
OUT = Path(__file__).resolve().parents[1] / "models"
OUT.mkdir(exist_ok=True)
S, BS = (224, 224), 32


def load(split, shuffle):
    return tf.keras.utils.image_dataset_from_directory(
        ROOT / split, class_names=CLASSES, image_size=S, batch_size=BS,
        shuffle=shuffle, seed=42, label_mode="int",
    )


train, val, test = load("train", True), load("val", False), load("test", False)

# Class weights: classes with fewer training images get a higher weight
counts = [len(list((ROOT / "train" / c).glob("*"))) for c in CLASSES]
total = sum(counts)
class_weight = {i: total / (len(CLASSES) * n) for i, n in enumerate(counts)}
print("Train images per class:", dict(zip(CLASSES, counts)))
print("Class weights:", {CLASSES[i]: round(w, 2) for i, w in class_weight.items()})

weights_tensor = tf.constant([class_weight[i] for i in range(len(CLASSES))], dtype=tf.float32)
train = train.map(lambda x, y: (x, y, tf.gather(weights_tensor, y)))

aug = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.1),
    tf.keras.layers.RandomZoom(0.15),
    tf.keras.layers.RandomContrast(0.15),
])

base = tf.keras.applications.MobileNetV2(input_shape=S + (3,), include_top=False, weights="imagenet")
base.trainable = False

inp = tf.keras.Input(S + (3,))
x = aug(inp)
x = tf.keras.layers.Rescaling(1 / 127.5, offset=-1)(x)  # MobileNetV2 preprocessing, saved inside the model
x = base(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.3)(x)
model = tf.keras.Model(inp, tf.keras.layers.Dense(len(CLASSES), activation="softmax")(x))

ckpt = tf.keras.callbacks.ModelCheckpoint(OUT / "waste_model.keras", monitor="val_accuracy", save_best_only=True)
stop = tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True)


def fit(lr, epochs):
    model.compile(optimizer=tf.keras.optimizers.Adam(lr), loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(train, validation_data=val, epochs=epochs, callbacks=[ckpt, stop])

fit(1e-3, 12)                 # stage 1: train only the new top layers
base.trainable = True         # stage 2: fine-tune the last 30 layers
for layer in base.layers[:-30]:
    layer.trainable = False
fit(1e-5, 10)

(OUT / "class_names.json").write_text(json.dumps(CLASSES))

# Evaluate the best saved model on the test set it has never seen
best = tf.keras.models.load_model(OUT / "waste_model.keras")
y_true = np.concatenate([y.numpy() for _, y in test])
y_pred = best.predict(test.map(lambda a, b: a), verbose=0).argmax(1)
report = classification_report(y_true, y_pred, target_names=CLASSES, output_dict=True, zero_division=0)
cm = confusion_matrix(y_true, y_pred)
(OUT / "evaluation.json").write_text(json.dumps({"report": report, "confusion_matrix": cm.tolist()}, indent=2))

print(classification_report(y_true, y_pred, target_names=CLASSES, zero_division=0))
print("Confusion matrix (rows = true class):")
print(cm)
print(f"Test accuracy: {report['accuracy']:.3f}")