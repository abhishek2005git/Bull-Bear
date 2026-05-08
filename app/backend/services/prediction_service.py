import base64
import datetime as dt
import io
import os
from dataclasses import dataclass
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
from keras.layers import LSTM
from keras.models import load_model


from core.exceptions import ApiError


plt.style.use("fivethirtyeight")
plt.switch_backend("Agg")


@dataclass
class PredictionResult:
    symbol: str
    currency_code: str
    predicted_price: float
    current_price: float
    change_amount: float
    change_percent: float
    training_samples: int
    test_samples: int
    generated_at: str
    charts: dict[str, str] | None


class PatchedLSTM(LSTM):
    def __init__(self, **kwargs):
        # Intercept and remove 'time_major' before initializing the layer
        kwargs.pop('time_major', None)
        super().__init__(**kwargs)

class StockPredictionService:
    def __init__(self, model_path: str, lookback_days: int = 100, history_start_year: int = 2000):
        # Pass the patched layer into custom_objects
        self.model = load_model(model_path, custom_objects={'LSTM': PatchedLSTM})
        self.lookback_days = lookback_days
        self.history_start_year = history_start_year

    def predict(self, symbol: str, include_charts: bool = False) -> PredictionResult:
        ticker = self._normalize_symbol(symbol)
        close_series = self._download_close_prices(ticker)
        currency_code = self._resolve_currency_code(ticker)

        scaled_values, scaler = self._scale_close_prices(close_series)
        x_test, y_test = self._build_sequences(scaled_values)

        y_pred_scaled = self.model.predict(x_test, verbose=0)
        y_pred = scaler.inverse_transform(y_pred_scaled).flatten()
        y_actual = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()

        next_input = scaled_values[-self.lookback_days :].reshape(1, self.lookback_days, 1)
        next_pred_scaled = self.model.predict(next_input, verbose=0)
        predicted_price = float(scaler.inverse_transform(next_pred_scaled)[0, 0])

        current_price = float(close_series.iloc[-1])
        change_amount = predicted_price - current_price
        change_percent = (change_amount / current_price) * 100 if current_price else 0.0

        charts = None
        if include_charts:
            charts = self._build_charts(ticker, close_series, y_actual, y_pred)

        return PredictionResult(
            symbol=ticker,
            currency_code=currency_code,
            predicted_price=predicted_price,
            current_price=current_price,
            change_amount=change_amount,
            change_percent=change_percent,
            training_samples=max(len(close_series) - len(x_test), 0),
            test_samples=len(x_test),
            generated_at=dt.datetime.now(dt.UTC).isoformat(),
            charts=charts,
        )

    def _resolve_currency_code(self, symbol: str) -> str:
        # If ticker has an exchange suffix (e.g. RELIANCE.NS), map that suffix first.
        suffix_currency_map = {
            "NS": "INR",
            "BO": "INR",
            "L": "GBP",
            "TO": "CAD",
            "V": "CAD",
            "AX": "AUD",
            "HK": "HKD",
            "T": "JPY",
            "KS": "KRW",
            "KQ": "KRW",
            "SS": "CNY",
            "SZ": "CNY",
            "DE": "EUR",
            "PA": "EUR",
            "AS": "EUR",
            "BR": "EUR",
            "SW": "CHF",
        }

        if "." in symbol:
            suffix = symbol.rsplit(".", 1)[1].upper()
            if suffix in suffix_currency_map:
                return suffix_currency_map[suffix]

        # Fallback to Yahoo metadata when suffix mapping is unavailable.
        try:
            ticker = yf.Ticker(symbol)
            fast_info = getattr(ticker, "fast_info", None)
            if fast_info and getattr(fast_info, "currency", None):
                return str(fast_info.currency).upper()

            info = getattr(ticker, "info", None)
            if isinstance(info, dict) and info.get("currency"):
                return str(info["currency"]).upper()
        except Exception:
            pass

        # Default for common US tickers without exchange suffix.
        return "USD"

    def _normalize_symbol(self, symbol: str) -> str:
        cleaned = (symbol or "").strip().upper()
        if not cleaned:
            raise ApiError("Ticker symbol is required.", status_code=400, code="symbol_required")
        return cleaned

    def _download_close_prices(self, symbol: str) -> pd.Series:
        start_date = dt.datetime(self.history_start_year, 1, 1)
        end_date = dt.datetime.now()
        history = yf.download(symbol, start=start_date, end=end_date, progress=False)

        if history.empty or "Close" not in history.columns:
            raise ApiError(
                f"No historical data found for '{symbol}'.",
                status_code=404,
                code="symbol_not_found",
            )

        close_data = history["Close"]

        # yfinance may return Close as a DataFrame (e.g., with MultiIndex columns).
        if isinstance(close_data, pd.DataFrame):
            close_series = close_data.iloc[:, 0].dropna()
        else:
            close_series = close_data.dropna()

        close_series = close_series.astype(float)
        if len(close_series) <= self.lookback_days:
            raise ApiError(
                f"Not enough historical data for '{symbol}'.",
                status_code=422,
                code="insufficient_data",
            )

        return close_series

    def _scale_close_prices(self, close_series: pd.Series) -> tuple[np.ndarray, MinMaxScaler]:
        close_values = close_series.to_numpy().reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_values = scaler.fit_transform(close_values)
        return scaled_values, scaler

    def _build_sequences(self, scaled_values: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        x_test: list[np.ndarray] = []
        y_test: list[float] = []

        for index in range(self.lookback_days, len(scaled_values)):
            x_test.append(scaled_values[index - self.lookback_days : index, 0])
            y_test.append(float(scaled_values[index, 0]))

        x_arr = np.array(x_test)
        y_arr = np.array(y_test)

        if x_arr.size == 0:
            raise ApiError(
                "Unable to build prediction sequence.",
                status_code=422,
                code="sequence_error",
            )

        x_arr = x_arr.reshape((x_arr.shape[0], x_arr.shape[1], 1))
        return x_arr, y_arr

    def _plot_to_base64(self, fig: Any) -> str:
        image_stream = io.BytesIO()
        fig.savefig(image_stream, format="png", bbox_inches="tight")
        image_stream.seek(0)
        encoded = base64.b64encode(image_stream.getvalue()).decode("utf-8")
        plt.close(fig)
        return f"data:image/png;base64,{encoded}"

    def _build_charts(
        self,
        symbol: str,
        close_series: pd.Series,
        y_actual: np.ndarray,
        y_predicted: np.ndarray,
    ) -> dict[str, str]:
        ema20 = close_series.ewm(span=20, adjust=False).mean()
        ema50 = close_series.ewm(span=50, adjust=False).mean()
        ema100 = close_series.ewm(span=100, adjust=False).mean()
        ema200 = close_series.ewm(span=200, adjust=False).mean()

        fig1, ax1 = plt.subplots(figsize=(12, 6))
        ax1.plot(close_series, "y", label="Closing Price")
        ax1.plot(ema20, "g", label="EMA 20")
        ax1.plot(ema50, "r", label="EMA 50")
        ax1.set_title(f"{symbol} - Closing Price (20 & 50 Days EMA)")
        ax1.legend()

        fig2, ax2 = plt.subplots(figsize=(12, 6))
        ax2.plot(close_series, "y", label="Closing Price")
        ax2.plot(ema100, "g", label="EMA 100")
        ax2.plot(ema200, "r", label="EMA 200")
        ax2.set_title(f"{symbol} - Closing Price (100 & 200 Days EMA)")
        ax2.legend()

        fig3, ax3 = plt.subplots(figsize=(12, 6))
        ax3.plot(y_actual, "g", label="Original Price", linewidth=1)
        ax3.plot(y_predicted, "r", label="Predicted Price", linewidth=1)
        ax3.set_title(f"{symbol} - Prediction vs Original Trend")
        ax3.legend()

        return {
            "ema_20_50": self._plot_to_base64(fig1),
            "ema_100_200": self._plot_to_base64(fig2),
            "prediction": self._plot_to_base64(fig3),
        }
