import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    model_path: str
    port: int
    debug: bool
    allowed_origins: str
    lookback_days: int
    history_start_year: int



def get_settings() -> Settings:
    model_path = os.getenv("MODEL_PATH", str(BASE_DIR / "stock_dl_model.h5"))
    port = int(os.getenv("FLASK_PORT", "5001"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
    lookback_days = int(os.getenv("LOOKBACK_DAYS", "100"))
    history_start_year = int(os.getenv("HISTORY_START_YEAR", "2000"))

    return Settings(
        model_path=model_path,
        port=port,
        debug=debug,
        allowed_origins=allowed_origins,
        lookback_days=lookback_days,
        history_start_year=history_start_year,
    )
