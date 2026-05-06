from flask import Flask, jsonify, request
from flask_cors import CORS

from core.config import get_settings
from core.exceptions import ApiError
from services.prediction_service import StockPredictionService


def create_app() -> Flask:
    settings = get_settings()
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins}})

    prediction_service = StockPredictionService(
        model_path=settings.model_path,
        lookback_days=settings.lookback_days,
        history_start_year=settings.history_start_year,
    )

    @app.get("/api/health")
    def healthcheck():
        return jsonify({"status": "ok"})

    @app.post("/api/predict")
    def predict_stock():
        payload = request.get_json(silent=True) or {}
        symbol = payload.get("symbol")
        include_charts = bool(payload.get("includeCharts", False))

        try:
            result = prediction_service.predict(symbol=symbol, include_charts=include_charts)
            return jsonify(
                {
                    "status": "success",
                    "data": {
                        "symbol": result.symbol,
                        "currencyCode": result.currency_code,
                        "predictedPrice": result.predicted_price,
                        "currentPrice": result.current_price,
                        "changeAmount": result.change_amount,
                        "changePercent": result.change_percent,
                        "trainingSamples": result.training_samples,
                        "testSamples": result.test_samples,
                        "generatedAt": result.generated_at,
                        "charts": result.charts,
                    },
                }
            )
        except ApiError as error:
            return (
                jsonify(
                    {
                        "status": "error",
                        "error": {
                            "code": error.code,
                            "message": error.message,
                        },
                    }
                ),
                error.status_code,
            )
        except Exception as error:  # pragma: no cover
            return (
                jsonify(
                    {
                        "status": "error",
                        "error": {
                            "code": "internal_error",
                            "message": str(error),
                        },
                    }
                ),
                500,
            )

    # Backward-compatible alias for existing callers.
    @app.post("/api/analyze")
    def analyze_stock():
        return predict_stock()

    return app


app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    app.run(debug=settings.debug, host="0.0.0.0", port=settings.port)