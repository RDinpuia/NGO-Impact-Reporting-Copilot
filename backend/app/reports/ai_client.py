"""
AI client abstraction: supports OpenAI, Gemini, and a mock provider.
Gracefully falls back to mock when no API key is configured.
"""

import json
from app.config import settings


def _build_prompt(kpis: dict, sentiment: dict, tone: str) -> str:
    """Build the AI prompt from extracted data."""
    tone_instructions = {
        "formal": "Use a formal, professional tone suitable for institutional donors and government agencies.",
        "storytelling": "Use a warm, narrative storytelling tone that highlights human impact and personal stories.",
        "concise": "Be brief and data-driven. Use bullet points and short paragraphs.",
    }

    problem_notes = []
    if kpis.get("total_records", 0) == 0 or kpis.get("total_beneficiaries", 0) == 0:
        problem_notes.append("The dataset contains zero recorded beneficiaries or zero valid records.")
    if kpis.get("avg_attendance", 0) == 0:
        problem_notes.append("Attendance is zero or missing, so the narrative should not overstate engagement.")
    if sentiment.get("score", 0) == 0:
        problem_notes.append("Sentiment score is 0%, so avoid positive language and describe concerns accurately.")

    guidance = """
Use precise, factual language. If the data shows zero metrics or low sentiment, do not portray the program as high-impact.
Avoid contradictions such as "0 attendance" paired with "high engagement".
"""

    return f"""You are an expert NGO impact report writer. Generate a professional impact report based on the following data.

TONE: {tone_instructions.get(tone, tone_instructions["formal"])}

KEY PERFORMANCE INDICATORS:
{json.dumps(kpis, indent=2, default=str)}

SENTIMENT ANALYSIS OF BENEFICIARY FEEDBACK:
- Positive responses: {sentiment.get('positive', 0)}
- Negative responses: {sentiment.get('negative', 0)}
- Neutral responses: {sentiment.get('neutral', 0)}
- Overall sentiment score: {sentiment.get('score', 0)}%

{guidance}

{' '.join(problem_notes)}

Generate a report with EXACTLY these four sections (use these exact headings):

## Executive Summary
A 2-3 paragraph overview of the program's impact and achievements.

## Key Impact Metrics
Present the key metrics in a clear, compelling format with context and interpretation.

## Impact Narrative
A detailed narrative about the program's impact on communities and beneficiaries.

## Challenges & Recommendations
Identify challenges observed in the data and provide actionable recommendations.

Write compelling, professional content. Do NOT use placeholder text."""


async def generate_report_content(kpis: dict, sentiment: dict, tone: str) -> dict:
    """Generate report content using the configured AI provider."""
    provider = settings.AI_PROVIDER.lower()

    if provider == "openai" and settings.OPENAI_API_KEY:
        return await _generate_openai(kpis, sentiment, tone)
    elif provider == "gemini" and settings.GEMINI_API_KEY:
        return await _generate_gemini(kpis, sentiment, tone)
    else:
        return _generate_mock(kpis, sentiment, tone)


async def _generate_openai(kpis: dict, sentiment: dict, tone: str) -> dict:
    """Generate using OpenAI GPT-4o."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = _build_prompt(kpis, sentiment, tone)

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert NGO impact report writer."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=3000,
    )

    text = response.choices[0].message.content or ""
    return _parse_sections(text)


async def _generate_gemini(kpis: dict, sentiment: dict, tone: str) -> dict:
    """Generate using Google Gemini."""
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = _build_prompt(kpis, sentiment, tone)

    response = model.generate_content(prompt)
    text = response.text or ""
    return _parse_sections(text)


def _parse_sections(text: str) -> dict:
    """Parse the AI response into the four report sections."""
    sections = {
        "executive_summary": "",
        "key_metrics": "",
        "impact_narrative": "",
        "challenges_recommendations": "",
    }

    # Split by ## headings
    parts = text.split("## ")
    for part in parts:
        lower = part.lower()
        if lower.startswith("executive summary"):
            sections["executive_summary"] = part.split("\n", 1)[1].strip() if "\n" in part else ""
        elif lower.startswith("key impact metrics") or lower.startswith("key metrics"):
            sections["key_metrics"] = part.split("\n", 1)[1].strip() if "\n" in part else ""
        elif lower.startswith("impact narrative"):
            sections["impact_narrative"] = part.split("\n", 1)[1].strip() if "\n" in part else ""
        elif lower.startswith("challenges"):
            sections["challenges_recommendations"] = part.split("\n", 1)[1].strip() if "\n" in part else ""

    return sections


def _generate_mock(kpis: dict, sentiment: dict, tone: str) -> dict:
    """Generate sample report content without an AI API (demo mode)."""
    total_ben = kpis.get("total_beneficiaries", 0)
    total_act = kpis.get("total_activities", 0)
    avg_att = kpis.get("avg_attendance", 0)
    score = sentiment.get("score", 0)
    total_records = kpis.get("total_records", 0)
    positive_feedback = sentiment.get("positive", 0)
    negative_feedback = sentiment.get("negative", 0)

    if total_records == 0:
        return {
            "executive_summary": "No valid data records were available for this report. Please upload a dataset containing at least one row of beneficiary field data.",
            "key_metrics": "- No metrics are available because the dataset contains zero records.",
            "impact_narrative": "Unable to generate an impact narrative without valid data. Upload a complete dataset to produce a reliable report.",
            "challenges_recommendations": "Ensure the uploaded dataset includes required columns and valid values before generating a report.",
        }

    attendance_description = (
        f"Attendance was limited during this period, with an average of {avg_att} participants per session." if avg_att == 0
        else f"Attendance averaged {avg_att} participants per session, indicating active participation where programs were delivered."
    )

    sentiment_description = (
        "The sentiment score is low, indicating that beneficiary experiences may need further investigation and improvement."
        if score <= 20
        else f"Beneficiary sentiment is measured at {score}%, suggesting that most participants are responding positively."
    )

    beneficiary_summary = (
        f"The dataset records {total_ben:,} unique beneficiaries." if total_ben > 0
        else "No beneficiaries were recorded in the dataset."
    )

    return {
        "executive_summary": f"""{beneficiary_summary}

{attendance_description}

{sentiment_description}""",

        "key_metrics": f"""- **Total Beneficiaries Reached**: {total_ben:,}
- **Program Activities**: {total_act} distinct types delivered
- **Average Session Attendance**: {avg_att} participants
- **Beneficiary Satisfaction**: {score}%
- **Data Points Collected**: {total_records} field records
- **Positive Feedback**: {positive_feedback} responses
- **Negative Feedback**: {negative_feedback} responses""",

        "impact_narrative": f"""This report reflects the actual dataset captured during the reporting period. {beneficiary_summary}

{attendance_description}

{sentiment_description}

The narrative is based on the available data and is intentionally grounded in what can be supported by the metrics above.""",

        "challenges_recommendations": f"""**Challenges Identified:**

1. **Data quality**: The dataset contains {total_records} records and should be reviewed for completeness.
2. **Feedback balance**: {negative_feedback} negative feedback items were recorded, signaling an opportunity to improve beneficiary experience.
3. **Program delivery**: Evaluate attendance patterns and ensure programming aligns with participant availability.

**Recommendations:**

1. **Review data collection**: Standardize data capture across regions to reduce invalid or missing values.
2. **Act on participant feedback**: Investigate negative sentiment items and address recurring concerns.
3. **Optimize attendance**: Adjust scheduling or outreach to improve participation.
4. **Validate future uploads**: Confirm that all required fields are present and correctly formatted before report generation.""",
    }
