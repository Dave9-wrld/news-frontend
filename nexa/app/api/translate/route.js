import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const DELIMITER = " §|§ ";
const translationCache = new Map();

export async function POST(request) {
  // Rate limiting: max 30 translations per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`translate_${clientIp}`, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Translation rate limit reached. Please wait ${rateLimit.resetInSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { title = "", description = "", content = "", targetLang = "en" } = body;

    if (!title && !description && !content) {
      return NextResponse.json({ error: "Text is required for translation" }, { status: 400 });
    }

    const cleanTargetLang = (targetLang || "en").trim().slice(0, 10);
    
    // Check in-memory cache
    const cacheKey = `${cleanTargetLang}:${title}:${description}`.slice(0, 300);
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        status: "ok",
        cached: true,
        targetLang: cleanTargetLang,
        ...translationCache.get(cacheKey),
      });
    }

    // Try Gemini translation if key is available
    if (GEMINI_API_KEY && cleanTargetLang !== "en") {
      try {
        const geminiResult = await translateWithGemini({ title, description, content, targetLang: cleanTargetLang });
        if (geminiResult) {
          translationCache.set(cacheKey, geminiResult);
          return NextResponse.json({
            status: "ok",
            provider: "gemini",
            targetLang: cleanTargetLang,
            ...geminiResult,
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini translation notice:", geminiErr.message);
      }
    }

    // Combine into single batched payload to minimize external requests
    const combined = [title || "", description || "", content || ""].join(DELIMITER);
    const translatedCombined = await translateText(combined, cleanTargetLang);

    let translatedTitle = title;
    let translatedDescription = description;
    let translatedContent = content;

    if (translatedCombined && translatedCombined.includes("§|§")) {
      const parts = translatedCombined.split("§|§").map((p) => p.trim());
      translatedTitle = parts[0] || title;
      translatedDescription = parts[1] || description;
      translatedContent = parts[2] || content;
    } else {
      // Individual translation fallback
      translatedTitle = (await translateText(title, cleanTargetLang)) || title;
      if (description) translatedDescription = (await translateText(description, cleanTargetLang)) || description;
      if (content && content !== description) translatedContent = (await translateText(content, cleanTargetLang)) || content;
    }

    const resultPayload = {
      translatedTitle,
      translatedDescription,
      translatedContent,
    };

    // Cache result
    if (translationCache.size > 500) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, resultPayload);

    return NextResponse.json({
      status: "ok",
      targetLang: cleanTargetLang,
      ...resultPayload,
    });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

async function translateWithGemini({ title, description, content, targetLang }) {
  const prompt = `Translate the following news article elements into language code '${targetLang}'.
Return ONLY valid JSON matching this schema:
{
  "translatedTitle": "<translated title>",
  "translatedDescription": "<translated description>",
  "translatedContent": "<translated content>"
}

Text to translate:
Title: ${title}
Description: ${description}
Content: ${content}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const cleanJson = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleanJson);
}

async function translateText(text, targetLang = "en") {
  if (!text || text.trim().length === 0 || targetLang === "en") return text;

  try {
    const encoded = encodeURIComponent(text.trim().slice(0, 2500));
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encoded}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) return text;

    const data = await res.json();
    if (data && Array.isArray(data[0])) {
      return data[0].map((item) => item[0]).join("").trim();
    }
    return text;
  } catch (err) {
    console.warn("Translation request notice:", err.message);
    return text;
  }
}
