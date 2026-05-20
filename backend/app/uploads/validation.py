"""Validation utilities for uploaded data files."""

import pandas as pd
from typing import List

class ValidationError(Exception):
    """Represents one or more validation failures in an uploaded dataset."""

    def __init__(self, errors: List[str]):
        super().__init__("Validation failed")
        self.errors = errors


def _normalize_text_column(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip()


def _get_invalid_text_rows(series: pd.Series) -> bool:
    normalized = _normalize_text_column(series).str.lower()
    return normalized.isin({"", "nan", "none"})


def _validate_integer_column(df: pd.DataFrame, column: str, errors: List[str]) -> None:
    numeric = pd.to_numeric(df[column], errors="coerce")
    if numeric.isna().any():
        errors.append(f"{column} must contain integer values")
        return
    # Check if any values are not whole numbers
    not_whole = (numeric != numeric.astype(int)).any()
    if not_whole:
        errors.append(f"{column} values must be whole numbers")


def _validate_numeric_column(df: pd.DataFrame, column: str, min_value: float, max_value: float, errors: List[str]) -> None:
    numeric = pd.to_numeric(df[column], errors="coerce")
    if numeric.isna().any():
        errors.append(f"{column} must be numeric")
        return
    if (numeric < min_value).any() or (numeric > max_value).any():
        errors.append(f"{column} values must be between {min_value} and {max_value}")


def _validate_text_columns(df: pd.DataFrame, columns: List[str], errors: List[str]) -> None:
    for column in columns:
        invalid_count = _get_invalid_text_rows(df[column]).sum()
        if invalid_count > 0:
            errors.append(f"{column} must contain non-empty text values")


def _validate_date_column(df: pd.DataFrame, column: str, errors: List[str]) -> None:
    parsed = pd.to_datetime(df[column], errors="coerce")
    if parsed.isna().any():
        errors.append(f"{column} contains invalid or unparsable dates")


def validate_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate that an uploaded dataset has usable rows and columns.

    The processor can work with generic CSV, Excel, and text files. NGO-specific
    columns improve the extracted metrics, but they are not mandatory.
    """
    errors: List[str] = []

    if df.empty:
        errors.append("Dataset contains no records")

    if len(df.columns) == 0:
        errors.append("Dataset contains no columns")

    if errors:
        raise ValidationError(errors)

    return df
