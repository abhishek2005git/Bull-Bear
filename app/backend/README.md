# Backend Prediction API

This backend serves stock price predictions using the model in `stock_dl_model.h5`.

## Architecture

- `app.py`: Flask app entrypoint and API routes.
- `core/config.py`: environment-driven settings.
- `core/exceptions.py`: API error abstraction.
- `services/prediction_service.py`: model inference and chart generation logic.
- `scripts/verify_prediction.sh`: quick local verification script.

## Runtime Defaults

- Host: `0.0.0.0`
- Port: `5001` (default changed from 5000 to avoid common macOS conflicts)
- Main endpoint: `POST /api/predict`
- Health endpoint: `GET /api/health`

## Use The Backend venv

This repo may contain multiple Python environments.
Use only the backend environment:

- Interpreter: `backend/venv/bin/python`

## Install Dependencies

From repo root:

```bash
cd backend
./venv/bin/python -m pip install -r requirements.txt
```

## Run Backend

From repo root:

```bash
./backend/venv/bin/python ./backend/app.py
```

## Verify Manually

Health:

```bash
curl -sS http://127.0.0.1:5001/api/health
```

Prediction:

```bash
curl -sS -X POST http://127.0.0.1:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","includeCharts":false}'
```

## One-Command Verification

From repo root:

```bash
./backend/scripts/verify_prediction.sh
```

Optional: also verify Next.js proxy route (requires Next.js dev server on port 3000):

```bash
./backend/scripts/verify_prediction.sh --next
```

## Environment Variables

Optional overrides:

- `MODEL_PATH` (default: backend `stock_dl_model.h5`)
- `FLASK_PORT` (default: `5001`)
- `FLASK_DEBUG` (`true` or `false`)
- `ALLOWED_ORIGINS` (default: `*`)
- `LOOKBACK_DAYS` (default: `100`)
- `HISTORY_START_YEAR` (default: `2000`)
