# Smart Waste AI — Segregation System

**Status (batch 1):** backend, SQLite analytics, dataset preparation, training and evaluation are written.
**Not yet built:** the React frontend (next batch).
**Not yet verified:** nothing here has been run against TensorFlow or a dataset. No model is included; you must train one.

## Windows PowerShell setup (run from the `smart-waste-segregation` folder)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
# If activation is blocked: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
```
Use Python 3.10-3.12 (TensorFlow does not support newer versions on Windows).

## 1. Dataset
Create `dataset\raw\<class>\` folders named exactly: `plastic, paper, glass, metal, organic, trash`.
TrashNet has `cardboard` (not `organic`) and no organic class. `cardboard` is NOT renamed to `organic`;
you may merge it into `paper`, but you must add real organic images yourself (e.g. a Kaggle food/organic waste set).
```powershell
python training\prepare_dataset.py   # refuses to run if any class is missing
```
## 2. Train and evaluate (CPU: roughly 20-60 min)
```powershell
python training\train.py
```
Outputs in `backend\models\`: `waste_model.keras`, `class_names.json`, `evaluation.json`.
## 3. Run backend
```powershell
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs
## 4. Test (second PowerShell window)
```powershell
curl.exe http://localhost:8000/health
curl.exe -X POST -F "file=@C:\path\to\bottle.jpg" http://localhost:8000/predict
curl.exe http://localhost:8000/analytics
```
## Troubleshooting
- `model_loaded: false`: train first; read `message` in `/health`.
- Port busy: use `--port 8001`.
- `No module named ...`: activate the venv, rerun `pip install -r requirements.txt`.
