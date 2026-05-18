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

    return f"""You are an expert NGO impact report writer. Generate a professional impact report based on the following data.

TONE: {tone_instructions.get(tone, tone_instructions["formal"])}

KEY PERFORMANCE INDICATORS:
{json.dumps(kpis, indent=2, default=str)}

SENTIMENT ANALYSIS OF BENEFICIARY FEEDBACK:
- Positive responses: {sentiment.get('positive', 0)}
- Negative responses: {sentiment.get('negative', 0)}
- Neutral responses: {sentiment.get('neutral', 0)}
- Overall sentiment score: {sentiment.get('score', 0)}%

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

    return {
        "executive_summary": f"""This reporting period has demonstrated significant progress across our program areas. Our initiatives have directly reached **{total_ben:,} beneficiaries** through **{total_act} distinct activity types**, reflecting a comprehensive approach to community development.

The data collected from {total_records} field records shows strong program engagement, with an average attendance rate of {avg_att} participants per session. Beneficiary feedback has been overwhelmingly positive, with a sentiment score of {score}% indicating high satisfaction with program delivery.

Our multi-regional approach has enabled us to serve diverse communities while maintaining consistent quality standards across all intervention areas.""",

        "key_metrics": f"""- **Total Beneficiaries Reached**: {total_ben:,}
- **Program Activities**: {total_act} distinct types delivered
- **Average Session Attendance**: {avg_att} participants
- **Beneficiary Satisfaction**: {score}% positive sentiment
- **Data Points Collected**: {total_records} field records
- **Positive Feedback**: {sentiment.get('positive', 0)} responses
- **Areas for Improvement**: {sentiment.get('negative', 0)} critical feedback items identified

The metrics demonstrate strong program reach and effectiveness. The high satisfaction rate indicates that our interventions are well-aligned with community needs and expectations.""",

        "impact_narrative": f"""Our programs have created meaningful change across the communities we serve. With {total_ben:,} beneficiaries reached, the impact extends beyond mere numbers — each interaction represents a life touched, a skill learned, or a barrier overcome.

Field feedback reveals powerful stories of transformation. {sentiment.get('positive', 0)} beneficiaries shared positive experiences, describing how the programs have improved their daily lives, enhanced their skills, and strengthened community bonds.

The consistency of engagement, reflected in our {avg_att} average attendance rate, speaks to the relevance and quality of our programming. Communities are not merely receiving services — they are actively participating in their own development journey.

Despite the challenges inherent in community development work, our teams have maintained their commitment to excellence, adapting approaches to meet the unique needs of each region while upholding our organization's core values of inclusivity and empowerment.""",

        "challenges_recommendations": f"""**Challenges Identified:**

1. **Feedback Gap**: {sentiment.get('negative', 0)} negative feedback items highlight areas where program delivery can be improved
2. **Data Coverage**: Some regions may have uneven data collection, requiring standardized reporting protocols
3. **Attendance Variability**: Fluctuations in attendance suggest the need for more flexible scheduling

**Recommendations:**

1. **Strengthen Feedback Mechanisms**: Implement regular feedback loops to address concerns proactively
2. **Expand Data Collection**: Standardize field data templates across all regions to ensure comprehensive coverage
3. **Diversify Programming**: Based on the activity type analysis, consider expanding successful program models to underserved areas
4. **Capacity Building**: Invest in staff training to improve data quality and program delivery
5. **Community Engagement**: Develop community advisory committees to increase local ownership and participation""",
    }
