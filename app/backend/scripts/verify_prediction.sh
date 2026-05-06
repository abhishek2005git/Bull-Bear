#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
PYTHON_BIN="$BACKEND_DIR/venv/bin/python"
BACKEND_URL="http://127.0.0.1:5001"
NEXT_URL="http://127.0.0.1:3000"
CHECK_NEXT=false

if [[ "${1:-}" == "--next" ]]; then
  CHECK_NEXT=true
fi

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "ERROR: Backend venv interpreter not found at $PYTHON_BIN"
  exit 1
fi

echo "[1/6] Checking backend dependencies"
"$PYTHON_BIN" -m pip install -r "$BACKEND_DIR/requirements.txt" >/dev/null

echo "[2/6] Starting backend server"
"$PYTHON_BIN" "$BACKEND_DIR/app.py" >/tmp/bull-bear-backend.log 2>&1 &
BACKEND_PID=$!
cleanup() {
  if kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "[3/6] Waiting for backend health"
for i in {1..30}; do
  if curl -fsS "$BACKEND_URL/api/health" >/tmp/bull-bear-health.json 2>/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -fsS "$BACKEND_URL/api/health" >/tmp/bull-bear-health.json 2>/dev/null; then
  echo "ERROR: Backend did not become healthy in time"
  echo "Backend logs:"
  cat /tmp/bull-bear-backend.log
  exit 1
fi

echo "[4/6] Verifying /api/health"
cat /tmp/bull-bear-health.json
echo

echo "[5/6] Verifying /api/predict"
PREDICT_RESPONSE="$(curl -fsS -X POST "$BACKEND_URL/api/predict" -H "Content-Type: application/json" -d '{"symbol":"AAPL","includeCharts":false}')"
echo "$PREDICT_RESPONSE"

"$PYTHON_BIN" - <<'PY' "$PREDICT_RESPONSE"
import json
import sys

payload = json.loads(sys.argv[1])
assert payload.get("status") == "success", payload
assert "data" in payload, payload
for key in ["symbol", "predictedPrice", "currentPrice", "changePercent"]:
    assert key in payload["data"], (key, payload)
print("Prediction response structure: OK")
PY

if [[ "$CHECK_NEXT" == true ]]; then
  echo "[6/6] Verifying Next.js proxy route /api/prediction"
  NEXT_RESPONSE="$(curl -fsS -X POST "$NEXT_URL/api/prediction" -H "Content-Type: application/json" -d '{"symbol":"AAPL","includeCharts":false}')"
  echo "$NEXT_RESPONSE"

  "$PYTHON_BIN" - <<'PY' "$NEXT_RESPONSE"
import json
import sys

payload = json.loads(sys.argv[1])
assert payload.get("status") == "success", payload
assert "data" in payload, payload
print("Next.js proxy response structure: OK")
PY
else
  echo "[6/6] Skipping Next.js proxy check (use --next to enable)"
fi

echo "All checks passed."
