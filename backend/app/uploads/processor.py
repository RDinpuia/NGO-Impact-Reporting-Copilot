"""
Data processor: parses CSV/Excel files, validates schema, extracts KPIs, and performs
keyword-based sentiment analysis on feedback columns.
"""

import pandas as pd
import re
from io import BytesIO
from typing import Any
from app.uploads.validation import validate_dataframe

# ─── Sentiment word lists ────────────────────────────────────────────────────

POSITIVE_WORDS = {
    "helped", "improved", "grateful", "better", "excellent", "great",
    "wonderful", "amazing", "good", "beneficial", "positive", "happy",
    "satisfied", "effective", "successful", "love", "thank", "appreciate",
    "useful", "valuable", "outstanding", "fantastic", "empowered",
    "transformed", "supported", "encouraged", "progress", "growth",
    "inspiring", "meaningful", "productive", "reliable", "safe",
}

NEGATIVE_WORDS = {
    "poor", "bad", "worse", "difficult", "struggling", "problem",
    "issue", "complaint", "unhappy", "disappointed", "inadequate",
    "insufficient", "failed", "lacking", "concern", "challenge",
    "frustrating", "terrible", "horrible", "neglected", "ignored",
    "limited", "shortage", "delay", "corrupt", "unsafe", "ineffective",
}


# ─── File parsing ────────────────────────────────────────────────────────────

def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV, Excel, or TXT file into a cleaned DataFrame."""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "csv":
        df = pd.read_csv(BytesIO(content))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(BytesIO(content))
    elif ext == "txt":
        try:
            df = pd.read_csv(BytesIO(content), sep=None, engine="python")
        except Exception:
            lines = content.decode("utf-8", errors="ignore").strip().split("\n")
            df = pd.DataFrame({"feedback": [l for l in lines if l.strip()]})
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # Clean column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    df = df.dropna(how="all")
    return df


# ─── Sentiment analysis ─────────────────────────────────────────────────────

def _analyze_one(text: str) -> str:
    """Classify a single text as positive/negative/neutral."""
    words = set(re.findall(r"\b\w+\b", text.lower()))
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    if pos > neg:
        return "positive"
    elif neg > pos:
        return "negative"
    return "neutral"


def analyze_feedback_sentiment(df: pd.DataFrame) -> dict[str, Any]:
    """Analyze sentiment across all feedback-like columns."""
    feedback_cols = [
        c for c in df.columns
        if any(k in c for k in ["feedback", "comment", "note", "text", "response"])
    ]
    if not feedback_cols:
        return {"positive": 0, "negative": 0, "neutral": 0, "total": 0, "score": 0, "details": []}

    col = feedback_cols[0]
    sentiments = {"positive": 0, "negative": 0, "neutral": 0}
    details = []

    for _, row in df.iterrows():
        text = str(row[col])
        if text and text.lower() != "nan":
            sentiment = _analyze_one(text)
            sentiments[sentiment] += 1
            details.append({"text": text[:200], "sentiment": sentiment})

    total = sum(sentiments.values())
    return {
        **sentiments,
        "total": total,
        "score": round(sentiments["positive"] / max(total, 1) * 100, 1),
        "details": details[:20],
    }


def _parse_sentiment_score(df: pd.DataFrame) -> float:
    numeric = pd.to_numeric(df["sentiment_score"], errors="coerce")
    if numeric.isna().all():
        return 0.0
    return round(float(numeric.mean()) * 100, 1)


# ─── KPI extraction ─────────────────────────────────────────────────────────

def extract_kpis(df: pd.DataFrame) -> dict[str, Any]:
    """Extract key performance indicators from the dataset."""
    kpis: dict[str, Any] = {
        "total_records": len(df),
        "columns": list(df.columns),
    }

    kpis["total_beneficiaries"] = int(df["beneficiary_id"].nunique())
    kpis["unique_beneficiaries"] = int(df["beneficiary_id"].nunique())

    attendance_numeric = pd.to_numeric(df["attendance"], errors="coerce")
    kpis["avg_attendance"] = round(float(attendance_numeric.mean()), 1) if not attendance_numeric.isna().all() else 0

    if "activity_type" in df.columns:
        kpis["total_activities"] = int(df["activity_type"].nunique())
        kpis["activity_types"] = {str(k): int(v) for k, v in df["activity_type"].value_counts().items()}
    else:
        kpis["total_activities"] = 0
        kpis["activity_types"] = {}

    sentiment_numeric = pd.to_numeric(df["sentiment_score"], errors="coerce")
    kpis["avg_sentiment_score"] = round(float(sentiment_numeric.mean()) * 100, 1) if not sentiment_numeric.isna().all() else 0

    return kpis


# ─── Breakdowns for charts ──────────────────────────────────────────────────

def get_region_breakdown(df: pd.DataFrame) -> list[dict]:
    """Count records per region/location."""
    if "region" not in df.columns:
        return []
    return [{"name": str(k), "count": int(v)} for k, v in df["region"].value_counts().head(10).items()]


def get_monthly_trends(df: pd.DataFrame) -> list[dict]:
    """Aggregate numeric values by month if a date column exists."""
    if "date" not in df.columns:
        return []
    try:
        dates = pd.to_datetime(df["date"], errors="coerce")
        monthly = dates.dt.to_period("M").value_counts().sort_index()

        attendance_numeric = pd.to_numeric(df["attendance"], errors="coerce")
        return [
            {"month": str(k), "attendance": int(attendance_numeric.loc[dates.dt.to_period("M") == k].sum()), "count": int(monthly.get(k, 0))}
            for k in monthly.index
        ]
    except Exception:
        return []


def get_beneficiary_distribution(df: pd.DataFrame) -> list[dict]:
    """Distribution by gender or age group if columns exist."""
    if "gender" in df.columns:
        return [{"name": str(k), "count": int(v)} for k, v in df["gender"].value_counts().items()]
    if "age" in df.columns or "age_group" in df.columns:
        age_col = "age" if "age" in df.columns else "age_group"
        return [{"name": str(k), "count": int(v)} for k, v in df[age_col].value_counts().items()]
    return []


def process_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """Run all processing steps and return a combined result dict."""
    validate_dataframe(df)
    sentiment_overall = _parse_sentiment_score(df)

    return {
        "kpis": extract_kpis(df),
        "sentiment": {
            **analyze_feedback_sentiment(df),
            "score": sentiment_overall,
        },
        "region_breakdown": get_region_breakdown(df),
        "monthly_trends": get_monthly_trends(df),
        "beneficiary_distribution": get_beneficiary_distribution(df),
        "sample_rows": df.head(10).fillna("").to_dict(orient="records"),
    }
