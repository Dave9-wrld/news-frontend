import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_documentation_docx(filename):
    doc = Document()

    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Document Title
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("THE GLOBAL DISPATCH (NEXA)")
    title_run.font.name = "Georgia"
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42) # Slate-900
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("Enterprise Real-Time Global News & Financial Intelligence Platform\nTechnical Architecture & API Reference Guide")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(12)
    sub_run.font.color.rgb = RGBColor(71, 85, 105) # Slate-600
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Meta line
    meta_p = doc.add_paragraph()
    meta_run = meta_p.add_run("Version 2.0.0 (Commercial Edition) | Built with Next.js 16.3, React 19, Tailwind CSS v4")
    meta_run.font.name = "Arial"
    meta_run.font.size = Pt(9.5)
    meta_run.font.italic = True
    meta_run.font.color.rgb = RGBColor(100, 116, 139)
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 1. Executive Summary
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Executive Summary & Architecture Overview")
    r.font.name = "Georgia"
    r.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph(
        "The Global Dispatch (Nexa) is a modern, high-speed news intelligence aggregator designed to syndicate real-time dispatches from over 80,000 international media outlets and financial news desks. Built with Next.js 16 (App Router) and React 19, the platform delivers zero-downtime reliability through a resilient multi-tier ingestion cascade, on-demand AI executive intelligence, universal neural translation into 9 languages, and hands-free text-to-speech audio narration."
    )

    # Ingestion Pipeline
    h2 = doc.add_heading(level=2)
    r = h2.add_run("Multi-Tier Ingestion Cascade (Zero-Downtime Guarantee)")
    r.font.name = "Georgia"
    r.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph(
        "To guarantee that users and clients never experience broken or blank screens, the platform implements a 4-tier ingestion strategy:"
    )

    tier_list = [
        ("Tier 1: GNews API (Primary Live Wire)", "Fetches verified real-time global news dispatches along with direct high-resolution publisher photos (e.g. Getty Images, ESPN, NYTimes, Bleacher Report)."),
        ("Tier 2: NewsAPI (Secondary Verified Provider)", "Supplements search and category feeds with strict English language filtering and verified publisher metadata."),
        ("Tier 3: Google News Live RSS Wire Engine", "A high-capacity real-time engine that processes unlimited global queries with zero rate limits, strict multi-pass HTML tag stripping, and keyword-to-topic photo inference."),
        ("Tier 4: Emergency Offline Safety Net (mockNews.js)", "A standalone offline fallback that protects the app from crashing if the server loses internet connectivity.")
    ]

    for title, desc in tier_list:
        p = doc.add_paragraph(style='List Bullet')
        r1 = p.add_run(f"{title}: ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(37, 99, 235)
        p.add_run(desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 2. Endpoints Breakdown
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. Complete API Endpoints Reference (6 Specialized Endpoints)")
    r.font.name = "Georgia"
    r.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph(
        "The application provides 6 specialized backend API routes built directly on the Next.js App Router layer:"
    )

    # Table of Endpoints
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    headers = ["#", "Endpoint Route", "Method", "Primary Function"]
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_background(hdr_cells[i], "1E293B")
        for p in hdr_cells[i].paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(9.5)

    endpoints_data = [
        ("1", "/api/news", "GET", "Main news ingestion engine: Search, categories, publishers, deduplication, virtual pagination."),
        ("2", "/api/news/headlines", "GET", "Convenience alias wrapper optimized for breaking top world headlines."),
        ("3", "/api/news/search", "GET", "Convenience alias wrapper optimized for direct keyword query requests."),
        ("4", "/api/news/sources", "GET", "Publishers directory: Returns verified international outlets categorized by sector."),
        ("5", "/api/summary", "POST", "AI Executive Intelligence: Synthesizes 3-bullet core takeaways, market impact & sentiment."),
        ("6", "/api/translate", "POST", "Universal Neural Translator: Translates dispatches into 9 world languages in real-time.")
    ]

    for row_idx, data in enumerate(endpoints_data):
        row_cells = table.add_row().cells
        for col_idx, text in enumerate(data):
            row_cells[col_idx].text = text
            if row_idx % 2 == 1:
                set_cell_background(row_cells[col_idx], "F8FAFC")
            for p in row_cells[col_idx].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9)
                    run.font.name = "Arial"

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # Detailed Endpoint Specs
    doc.add_heading(level=2, text="Detailed Endpoint Specifications & Sample Payloads")

    specs = [
        ("Endpoint 1: GET /api/news", 
         "Parameters: q (query string), category (tech, business, science, sports, health, entertainment, all), country (us, gb, ca, au), sources (publisher ID), sortBy (publishedAt, relevancy), page, pageSize.\n\nSample Response:\n{\n  \"status\": \"ok\",\n  \"source\": \"gnews\",\n  \"totalResults\": 45,\n  \"page\": 1,\n  \"hasMore\": true,\n  \"articles\": [\n    {\n      \"title\": \"Global Central Banks Signal Stable Rates\",\n      \"source\": { \"name\": \"Bloomberg\" },\n      \"sentiment\": \"positive\",\n      \"readTime\": \"3m read\",\n      \"urlToImage\": \"https://images.unsplash.com/...\"\n    }\n  ]\n}"),

        ("Endpoint 5: POST /api/summary (AI Executive Briefing)",
         "Request Body:\n{\n  \"title\": \"Next-Gen Quantum Computing Architecture Sustains Millisecond Coherence\",\n  \"description\": \"Researchers announce 10x improvement in qubit stability...\",\n  \"category\": \"technology\"\n}\n\nResponse Output:\n{\n  \"status\": \"ok\",\n  \"summary\": {\n    \"takeaways\": [\n      \"Core Event: Next-Gen Quantum Architecture Sustains Coherence.\",\n      \"Context: 10x improvement in qubit stability reported at cryogenic tiers.\",\n      \"Strategic Outlook: Accelerates transition toward commercial cryptographic algorithms.\"\n    ],\n    \"marketImpact\": \"High relevance for enterprise infrastructure, venture capital, and cloud AI.\",\n    \"sentiment\": { \"tone\": \"Positive\", \"score\": \"+84%\" }\n  }\n}"),

        ("Endpoint 6: POST /api/translate (Universal Neural Translator)",
         "Supported Languages: English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Chinese (zh-CN), Japanese (ja), Arabic (ar).\n\nRequest Body:\n{\n  \"title\": \"El Real Madrid celebra la victoria con gol de Mbappé\",\n  \"description\": \"El delantero francés brilló en el partido.\",\n  \"targetLang\": \"en\"\n}\n\nResponse Output:\n{\n  \"status\": \"ok\",\n  \"targetLang\": \"en\",\n  \"translatedTitle\": \"Real Madrid celebrates victory with a goal from Mbappé\",\n  \"translatedDescription\": \"The French striker shone in the match.\"\n}")
    ]

    for title, code_block in specs:
        h3 = doc.add_heading(level=3)
        r = h3.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(14, 116, 144)

        p = doc.add_paragraph()
        r_code = p.add_run(code_block)
        r_code.font.name = "Consolas"
        r_code.font.size = Pt(8.5)
        r_code.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 3. Component Breakdown
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Frontend Components & User Experience Architecture")
    r.font.name = "Georgia"
    r.font.color.rgb = RGBColor(30, 41, 59)

    components = [
        ("MarketTicker.jsx", "Live global financial ticker tracking S&P 500, NASDAQ, DOW, BTC, ETH, NVIDIA, Apple, Gold, and Brent Crude with live movement indicators."),
        ("BriefingDrawer.jsx", "Executive Morning Intelligence Briefing tool that bundles the day's top dispatches with one-click Copy Markdown, Export File (.md), and full Text-to-Speech audio narration."),
        ("ArticleModal.jsx", "Smart Executive Reader featuring AI Key Takeaways, instant Neural Translator across 9 languages, Text-to-Speech narration, font-size adjustment, and outbound publisher syndication."),
        ("BookmarksDrawer.jsx", "Saved dispatches reading list featuring instant in-drawer search, item removal, and full Export to JSON functionality."),
        ("NewsCard.jsx & HeroFeatured.jsx", "Editorial layout with sentiment badges (Breakthrough, Alert, Analysis), estimated reading times, dynamic non-repeating visuals, and quick voice listen triggers."),
        ("imageUtils.js", "Topic-inferred visual resolution engine ensuring that cards dynamically display relevant high-resolution photos with 0 repetitive stock images.")
    ]

    for comp_name, comp_desc in components:
        p = doc.add_paragraph(style='List Bullet')
        r_title = p.add_run(f"{comp_name}: ")
        r_title.bold = True
        r_title.font.color.rgb = RGBColor(15, 23, 42)
        p.add_run(comp_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # 4. Commercial Value
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Commercial Valuation & Client Deliverable Matrix")
    r.font.name = "Georgia"
    r.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph(
        "With the integration of the AI Executive Intelligence API, Neural Translation Engine, Real-Time Market Ticker, TTS Voice Reader, Morning Briefing Exporter, and resilient multi-provider ingestion cascade, this platform meets enterprise-grade commercial standards valued at $1,000+ as a turnkey SaaS or high-ticket client deliverable."
    )

    doc.save(filename)
    print(f"Document saved successfully as {filename}")

if __name__ == "__main__":
    create_documentation_docx("The-Global-Dispatch-Documentation.docx")
