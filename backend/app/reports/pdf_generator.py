"""
PDF generator using ReportLab. Creates professional, styled PDF reports.
"""

from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# Brand colors
PRIMARY = HexColor("#0F766E")    # Teal
DARK = HexColor("#1E293B")       # Slate 800
MUTED = HexColor("#64748B")      # Slate 500
LIGHT_BG = HexColor("#F0FDFA")   # Teal 50
BORDER = HexColor("#CBD5E1")     # Slate 300


def _get_styles():
    """Build custom paragraph styles for the report."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=PRIMARY,
        spaceAfter=6,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=MUTED,
        spaceAfter=20,
    ))
    styles.add(ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=16,
        textColor=DARK,
        spaceBefore=20,
        spaceAfter=10,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        "BodyText2",
        parent=styles["Normal"],
        fontSize=10,
        leading=16,
        textColor=DARK,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "MetricLabel",
        parent=styles["Normal"],
        fontSize=9,
        textColor=MUTED,
    ))
    styles.add(ParagraphStyle(
        "MetricValue",
        parent=styles["Normal"],
        fontSize=14,
        textColor=PRIMARY,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=MUTED,
        alignment=TA_CENTER,
    ))

    return styles


def generate_pdf(report: dict) -> bytes:
    """Generate a professional PDF from report data. Returns PDF bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
    )
    styles = _get_styles()
    elements = []

    # ── Title block ──────────────────────────────────────────────────────
    elements.append(Paragraph(report.get("title", "Impact Report"), styles["ReportTitle"]))
    elements.append(Paragraph(
        f"Generated on {report.get('created_at', 'N/A')} &bull; Tone: {report.get('tone', 'formal').title()}",
        styles["ReportSubtitle"],
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=15))

    # ── KPI summary cards ────────────────────────────────────────────────
    kpis = report.get("kpis", {})
    kpi_data = [
        ("Total Beneficiaries", f"{kpis.get('total_beneficiaries', 0):,}"),
        ("Activities", str(kpis.get("total_activities", 0))),
        ("Avg Attendance", str(kpis.get("avg_attendance", 0))),
        ("Sentiment Score", f"{report.get('sentiment', {}).get('score', 0)}%"),
    ]

    kpi_table_data = [
        [Paragraph(label, styles["MetricLabel"]) for label, _ in kpi_data],
        [Paragraph(value, styles["MetricValue"]) for _, value in kpi_data],
    ]

    kpi_table = Table(kpi_table_data, colWidths=[doc.width / 4] * 4)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 15))

    # ── Report sections ──────────────────────────────────────────────────
    content = report.get("content", {})
    sections = [
        ("Executive Summary", content.get("executive_summary", "")),
        ("Key Impact Metrics", content.get("key_metrics", "")),
        ("Impact Narrative", content.get("impact_narrative", "")),
        ("Challenges & Recommendations", content.get("challenges_recommendations", "")),
    ]

    for heading, body in sections:
        if not body:
            continue

        section_elements = [Paragraph(heading, styles["SectionHeading"])]

        # Convert markdown-style formatting to ReportLab
        for paragraph in body.split("\n\n"):
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            # Bold markers
            paragraph = paragraph.replace("**", "<b>", 1)
            while "**" in paragraph:
                paragraph = paragraph.replace("**", "</b>", 1)
                if "**" in paragraph:
                    paragraph = paragraph.replace("**", "<b>", 1)
            # Bullet points
            if paragraph.startswith("- ") or paragraph.startswith("* "):
                paragraph = f"&bull; {paragraph[2:]}"
            section_elements.append(Paragraph(paragraph, styles["BodyText2"]))

        elements.append(KeepTogether(section_elements[:3]))
        if len(section_elements) > 3:
            elements.extend(section_elements[3:])
        elements.append(Spacer(1, 10))

    # ── Footer ───────────────────────────────────────────────────────────
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))
    elements.append(Paragraph(
        "Generated by ImpactLens &mdash; NGO Impact Reporting Copilot",
        styles["Footer"],
    ))

    doc.build(elements)
    return buffer.getvalue()
