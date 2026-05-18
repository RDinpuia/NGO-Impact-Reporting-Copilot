"""
Data processor: parses CSV/Excel files, extracts KPIs, and performs
keyword-based sentiment analysis on feedback columns.
"""

import pandas as pd
import re
from io import BytesIO
from typing import Any

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


# ─── KPI extraction ─────────────────────────────────────────────────────────

def _find_cols(df: pd.DataFrame, keywords: list[str]) -> list[str]:
    """Find columns whose names contain any of the given keywords."""
    return [c for c in df.columns if any(k in c for k in keywords)]


def extract_kpis(df: pd.DataFrame) -> dict[str, Any]:
    """Extract key performance indicators from the dataset."""
    kpis: dict[str, Any] = {"total_records": len(df), "columns": list(df.columns)}

    # Beneficiaries
    ben_cols = _find_cols(df, ["beneficiar", "participant", "people", "reached"])
    if ben_cols:
        numeric = pd.to_numeric(df[ben_cols[0]], errors="coerce")
        kpis["total_beneficiaries"] = int(numeric.sum()) if not numeric.isna().all() else 0
        kpis["avg_beneficiaries"] = round(float(numeric.mean()), 1) if not numeric.isna().all() else 0

    # Attendance
    att_cols = _find_cols(df, ["attend"])
    if att_cols:
        numeric = pd.to_numeric(df[att_cols[0]], errors="coerce")
        kpis["avg_attendance"] = round(float(numeric.mean()), 1) if not numeric.isna().all() else 0

    # Activities
    act_cols = _find_cols(df, ["activity", "program", "event"])
    if act_cols:
        kpis["total_activities"] = int(df[act_cols[0]].nunique())
        kpis["activity_types"] = {str(k): int(v) for k, v in df[act_cols[0]].value_counts().items()}

    return kpis


# ─── Breakdowns for charts ──────────────────────────────────────────────────

def get_region_breakdown(df: pd.DataFrame) -> list[dict]:
    """Count records per region/location."""
    cols = _find_cols(df, ["region", "location", "area", "district", "province", "state", "city"])
    if not cols:
        return []
    return [{"name": str(k), "count": int(v)} for k, v in df[cols[0]].value_counts().head(10).items()]


def get_monthly_trends(df: pd.DataFrame) -> list[dict]:
    """Aggregate numeric values by month if a date column exists."""
    date_cols = _find_cols(df, ["date", "month", "time", "period"])
    if not date_cols:
        return []
    try:
        dates = pd.to_datetime(df[date_cols[0]], errors="coerce")
        monthly = dates.dt.to_period("M").value_counts().sort_index()

        ben_cols = _find_cols(df, ["beneficiar", "participant", "people", "attend"])
        if ben_cols:
            tmp = df.copy()
            tmp["_month"] = dates.dt.to_period("M")
            tmp[ben_cols[0]] = pd.to_numeric(tmp[ben_cols[0]], errors="coerce")
            monthly_sum = tmp.groupby("_month")[ben_cols[0]].sum()
            return [{"month": str(k), "value": int(v), "count": int(monthly.get(k, 0))} for k, v in monthly_sum.items()]

        return [{"month": str(k), "count": int(v)} for k, v in monthly.items()]
    except Exception:
        return []


def get_beneficiary_distribution(df: pd.DataFrame) -> list[dict]:
    """Distribution by gender or age group if columns exist."""
    # Try gender first
    cols = _find_cols(df, ["gender", "sex"])
    if cols:
        return [{"name": str(k), "count": int(v)} for k, v in df[cols[0]].value_counts().items()]
    # Fall back to age group
    cols = _find_cols(df, ["age", "age_group"])
    if cols:
        return [{"name": str(k), "count": int(v)} for k, v in df[cols[0]].value_counts().items()]
    return []


def process_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """Run all processing steps and return a combined result dict."""
    return {
        "kpis": extract_kpis(df),
        "sentiment": analyze_feedback_sentiment(df),
        "region_breakdown": get_region_breakdown(df),
        "monthly_trends": get_monthly_trends(df),
        "beneficiary_distribution": get_beneficiary_distribution(df),
        "sample_rows": df.head(10).fillna("").to_dict(orient="records"),
    }
