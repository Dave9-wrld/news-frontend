import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

export async function POST(request) {
  // Rate limiting check: max 25 summaries per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`summary_${clientIp}`, 25, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Please wait ${rateLimit.resetInSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, content, source, category } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Valid article title is required" }, { status: 400 });
    }

    // Sanitize and cap length to prevent prompt injection or payload bloating
    const safeTitle = sanitizeInput(title, 300);
    const safeDesc = sanitizeInput(description || "", 1500);
    const safeContent = sanitizeInput(content || "", 4000);
    const safeSource = typeof source === "object" ? source?.name || "Global Wire" : sanitizeInput(source || "Global Wire", 100);
    const safeCategory = sanitizeInput(category || "general", 50);

    // Try Real Gemini AI if API key is provided
    if (GEMINI_API_KEY) {
      try {
        const aiSummary = await generateWithGemini({
          title: safeTitle,
          description: safeDesc,
          content: safeContent,
          source: safeSource,
          category: safeCategory,
        });
        if (aiSummary) {
          return NextResponse.json({
            status: "ok",
            provider: "gemini",
            summary: aiSummary,
          });
        }
      } catch (err) {
        console.warn("Gemini API notice:", err.message);
      }
    }

    // Dynamic Content-Aware NLP Semantic Extraction Engine
    const summaryData = generateSemanticExecutiveSummary({
      title: safeTitle,
      description: safeDesc,
      content: safeContent,
      source: safeSource,
      category: safeCategory,
    });

    return NextResponse.json({
      status: "ok",
      provider: "semantic_nlp",
      summary: summaryData,
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}

function sanitizeInput(str, maxLength) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Real Google Gemini Integration with structured output
 */
async function generateWithGemini({ title, description, content, source, category }) {
  const prompt = `You are a senior executive intelligence analyst for a global financial and news publication.
Analyze the following news dispatch and produce a structured JSON response.

Dispatch Information:
- Title: ${title}
- Source: ${source}
- Section: ${category}
- Dispatch Text: ${description} ${content}

Return ONLY valid JSON matching this schema:
{
  "takeaways": [
    "Core Development: <1 clear sentence describing what specifically occurred>",
    "Key Evidence: <1 sentence citing key facts, numbers, or stakeholders from text>",
    "Strategic Relevance: <1 sentence on what this means for markets, policy, or industry>"
  ],
  "marketImpact": "<1-2 sentences detailing tangible sector, economic, or public impact based on text>",
  "sentiment": {
    "tone": "<Positive | Critical Alert | Strategic / Analytical | Objective Wire>",
    "score": "<percentage, e.g. +75% or -60% or Neutral>",
    "color": "<emerald | rose | sky | slate>"
  }
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  let parsed = null;
  try {
    const cleanJson = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    parsed = JSON.parse(cleanJson);
  } catch (parseErr) {
    console.warn("Gemini JSON parse fallback notice:", parseErr.message);
    return null;
  }

  const combinedText = `${title} ${description} ${content}`;
  const totalWords = combinedText.split(/\s+/).filter(Boolean).length;

  return {
    ...parsed,
    metrics: {
      totalWords,
      fastSummarySeconds: "15 sec overview",
      fullReadMinutes: `${Math.max(1, Math.ceil(totalWords / 180))} min read`,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Content-Aware NLP Semantic Extraction Engine
 */
function generateSemanticExecutiveSummary({ title, description, content, source, category }) {
  const combinedText = `${title}. ${description}. ${content}`.replace(/\s+/g, " ").trim();
  const sentences = extractDistinctSentences(combinedText);
  const keyFacts = extractKeyFacts(combinedText);
  const quotes = extractQuotes(combinedText);

  // 1. Key Takeaways Extraction
  const takeaways = [];
  
  // Point 1: Core development
  takeaways.push(`Core Event: ${cleanSentence(title)}`);

  // Point 2: Specific context / detail extracted from actual text
  const bestContextSentence = findBestContextSentence(sentences, title);
  if (bestContextSentence) {
    takeaways.push(`Context & Evidence: ${bestContextSentence}`);
  } else if (quotes.length > 0) {
    takeaways.push(`Statement: "${quotes[0]}"`);
  } else if (keyFacts.length > 0) {
    takeaways.push(`Key Indicators: Highlighted metrics include ${keyFacts.join(", ")}.`);
  } else {
    takeaways.push(`Verification: Verified intelligence syndicated directly via ${source} editorial wire.`);
  }

  // Point 3: Strategic Relevance derived from actual extracted facts & category
  const strategicPoint = deriveDynamicOutlook(title, description, category, keyFacts);
  takeaways.push(`Strategic Outlook: ${strategicPoint}`);

  // 2. Dynamic Market & Sector Impact
  const marketImpact = deriveDynamicMarketImpact(title, description, category, keyFacts);

  // 3. Sentiment & Urgency
  const sentiment = calculateSentimentMetrics(combinedText);

  // 4. Reading metrics
  const totalWords = combinedText.split(/\s+/).filter(Boolean).length;
  const fastSummarySeconds = 15;
  const fullReadMinutes = Math.max(1, Math.ceil(totalWords / 180));

  return {
    takeaways,
    marketImpact,
    sentiment,
    metrics: {
      totalWords,
      fastSummarySeconds: `${fastSummarySeconds} sec overview`,
      fullReadMinutes: `${fullReadMinutes} min read`,
    },
    generatedAt: new Date().toISOString(),
  };
}

function extractDistinctSentences(text) {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && !s.toLowerCase().startsWith("http"));
}

function extractQuotes(text) {
  const matches = text.match(/["“]([^"”]{15,140})["”]/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/["“”]/g, "").trim()).slice(0, 2);
}

function extractKeyFacts(text) {
  const facts = [];
  // Match currency amounts: $500M, €2.5B, £100k
  const currencyMatches = text.match(/[\$€£¥]\s?\d+(?:[.,]\d+)?(?:\s?(?:billion|million|trillion|B|M|k))?/gi);
  if (currencyMatches) facts.push(...currencyMatches.slice(0, 2));

  // Match percentages: 25%, +4.2%
  const percentMatches = text.match(/[+-]?\d+(?:\.\d+)?%/g);
  if (percentMatches) facts.push(...percentMatches.slice(0, 2));

  // Match standalone figures: 10,000+, 500 miles, etc.
  const metricMatches = text.match(/\b\d+(?:,\d+)*(?:\.\d+)?\s*(?:qubits|miles|km|meters|patients|voters|troops|barrels|tons)\b/gi);
  if (metricMatches) facts.push(...metricMatches.slice(0, 2));

  return [...new Set(facts)].slice(0, 4);
}

function findBestContextSentence(sentences, title) {
  const titleLower = title.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const titleWords = new Set(titleLower.split(/\s+/).filter((w) => w.length > 3));

  for (const s of sentences) {
    const sLower = s.toLowerCase();
    if (sLower.includes(titleLower.slice(0, 30))) continue;

    const sWords = sLower.split(/\s+/).filter((w) => w.length > 3);
    const overlap = sWords.filter((w) => titleWords.has(w)).length;

    if (sWords.length >= 6 && overlap >= 1 && overlap <= sWords.length * 0.7) {
      return cleanSentence(s);
    }
  }

  const nonTitle = sentences.find((s) => !s.toLowerCase().includes(titleLower.slice(0, 25)));
  return nonTitle ? cleanSentence(nonTitle) : null;
}

function deriveDynamicOutlook(title, desc, category, keyFacts = []) {
  const text = `${title} ${desc}`.toLowerCase();
  const factStr = keyFacts.length > 0 ? ` (notably around ${keyFacts[0]})` : "";

  if (text.match(/\b(ai|artificial intelligence|model|gpt|deepmind|chip|nvidia|semiconductor|computing|quantum)\b/)) {
    return `Signals accelerated infrastructure deployment and competitive repositioning across enterprise technology pipelines${factStr}.`;
  }
  if (text.match(/\b(rate|fed|inflation|cpi|treasury|recession|stock|shares|nasdaq|bond|yield)\b/)) {
    return `Informs institutional liquidity projections, treasury yield curves, and risk allocations across global capital desks${factStr}.`;
  }
  if (text.match(/\b(trial|vaccine|fda|cancer|treatment|health|pharma|clinical)\b/)) {
    return `Provides clinical benchmarks for regulatory evaluation timelines, therapeutic pipelines, and public health directives${factStr}.`;
  }
  if (text.match(/\b(climate|energy|solar|nuclear|carbon|oil|gas|grid|renewable)\b/)) {
    return `Influences national grid sustainability metrics, resource allocation strategies, and global energy transition mandates${factStr}.`;
  }
  if (text.match(/\b(election|court|probe|investigation|war|treaty|diplomacy|sanction|parliament)\b/)) {
    return `Carries strategic diplomatic and policy significance, impacting legislative priorities and bilateral security relationships.`;
  }

  switch (category) {
    case "technology":
      return `Accelerates modernization benchmarks across core digital systems${factStr}.`;
    case "business":
      return `Serves as a pivotal indicator for corporate guidance, investor sentiment, and sectoral liquidity${factStr}.`;
    case "science":
      return `Unlocks empirical findings with direct downstream applications for academic and commercial research${factStr}.`;
    case "sports":
      return `Shifts competitive standings and championship momentum across seasonal fixtures.`;
    default:
      return `Provides essential context for institutional analysts, industry leaders, and informed observers.`;
  }
}

function deriveDynamicMarketImpact(title, desc, category, keyFacts = []) {
  const text = `${title} ${desc}`.toLowerCase();

  if (text.match(/\b(crypto|bitcoin|ethereum|solana|blockchain)\b/)) {
    return "Direct influence on digital asset liquidity, exchange-traded fund inflows, and retail sentiment.";
  }
  if (text.match(/\b(apple|microsoft|google|amazon|meta|nvidia|tesla)\b/)) {
    return "High correlation with mega-cap index momentum, semiconductor supply chains, and equity ETF flows.";
  }
  if (text.match(/\b(oil|brent|crude|opec|energy|petroleum)\b/)) {
    return "Direct benchmark for international freight costs, refining margins, and headline inflation metrics.";
  }

  switch (category) {
    case "technology":
      return "Direct relevance for enterprise software expenditure, cloud infrastructure capacity, and hardware sourcing.";
    case "business":
      return "Immediate implications for corporate balance sheets, quarterly revenue targets, and commercial credit spreads.";
    case "science":
    case "health":
      return "Critical evaluation criteria for life sciences venture capital, clinical trials, and intellectual property portfolios.";
    case "sports":
    case "entertainment":
      return "Substantial commercial influence on broadcasting syndication values, advertising revenue, and media rights.";
    default:
      return "Broad macroeconomic resonance affecting cross-sector market confidence and stakeholder expectations.";
  }
}

function calculateSentimentMetrics(text) {
  const lower = text.toLowerCase();
  let score = 0;

  const positiveWords = ["breakthrough", "surge", "record", "rally", "soars", "gains", "jump", "boom", "success", "victory", "win", "growth", "approved", "milestone", "advances", "stabilization"];
  const negativeWords = ["crisis", "collapse", "plunges", "drop", "fall", "warns", "threat", "war", "danger", "crash", "probe", "investigation", "deficit", "loss", "ban", "sanction", "decline"];
  const analyticalWords = ["policy", "report", "study", "plan", "proposes", "unveils", "announces", "analysis", "signals", "targets", "review", "framework", "guidance"];

  positiveWords.forEach((w) => { if (lower.includes(w)) score += 15; });
  negativeWords.forEach((w) => { if (lower.includes(w)) score -= 15; });
  analyticalWords.forEach((w) => { if (lower.includes(w)) score += 2; });

  if (score >= 15) {
    const pct = Math.min(95, 60 + score);
    return { tone: "Bullish / Positive", score: `+${pct}%`, color: "emerald" };
  }
  if (score <= -15) {
    const pct = Math.min(95, 55 + Math.abs(score));
    return { tone: "Critical Alert", score: `-${pct}%`, color: "rose" };
  }
  if (analyticalWords.some((w) => lower.includes(w))) {
    return { tone: "Strategic / Analytical", score: "Neutral / Balanced", color: "sky" };
  }
  return { tone: "Objective Wire", score: "Balanced", color: "slate" };
}

function cleanSentence(str) {
  if (!str) return "";
  let cleaned = str.trim();
  if (!/[.!?]$/.test(cleaned)) cleaned += ".";
  return cleaned;
}
