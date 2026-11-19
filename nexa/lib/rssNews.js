import { XMLParser } from "fast-xml-parser";
import { getDynamicArticleImage, inferCategoryFromText } from "./imageUtils.js";
import { generateArticleId, calculateReadTime } from "./articleUtils.js";

const CATEGORY_TOPICS = {
  general: "WORLD",
  technology: "TECHNOLOGY",
  business: "BUSINESS",
  science: "SCIENCE",
  sports: "SPORTS",
  entertainment: "ENTERTAINMENT",
  health: "HEALTH",
};

const COUNTRY_CONFIGS = {
  us: { hl: "en-US", gl: "US", ceid: "US:en" },
  gb: { hl: "en-GB", gl: "GB", ceid: "GB:en" },
  ca: { hl: "en-CA", gl: "CA", ceid: "CA:en" },
  au: { hl: "en-AU", gl: "AU", ceid: "AU:en" },
};

// Direct Major Publisher Wire Feeds by Category (High-Res Image Guarantees)
const DIRECT_PUBLISHER_FEEDS = {
  general: [
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/world.xml", cat: "general" },
    { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", cat: "general" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", cat: "general" },
  ],
  technology: [
    { name: "Sky News Tech", url: "https://feeds.skynews.com/feeds/rss/technology.xml", cat: "technology" },
    { name: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", cat: "technology" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", cat: "technology" },
  ],
  business: [
    { name: "Sky News Business", url: "https://feeds.skynews.com/feeds/rss/business.xml", cat: "business" },
    { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", cat: "business" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", cat: "business" },
  ],
  science: [
    { name: "BBC Science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", cat: "science" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", cat: "science" },
  ],
  sports: [
    { name: "Sky Sports", url: "https://www.skysports.com/rss/12040", cat: "sports" },
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", cat: "sports" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", cat: "sports" },
  ],
  entertainment: [
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/entertainment.xml", cat: "entertainment" },
    { name: "BBC News", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", cat: "entertainment" },
  ],
  health: [
    { name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml", cat: "health" },
    { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", cat: "health" },
  ],
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "__cdata",
  trimValues: true,
  parseTagValue: false,
});

function analyzeSentimentAndTags(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  
  if (text.match(/\b(breakthrough|surge|record|rally|soars|gains|jump|boom|success|victory|win|signed|joins|advances)\b/)) {
    return { sentiment: "positive", sentimentLabel: "Bullish / Positive", tag: "Breakthrough" };
  }
  if (text.match(/\b(crisis|collapse|plunges|drop|fall|warns|threat|war|danger|crash|probe|investigation|racism|racist|attack|injury|injured|deficit|loss)\b/)) {
    return { sentiment: "critical", sentimentLabel: "Critical / Alert", tag: "Alert" };
  }
  if (text.match(/\b(policy|report|study|plan|proposes|unveils|announces|analysis|signals|targets|number|jersey|squad|framework|review)\b/)) {
    return { sentiment: "analysis", sentimentLabel: "Analysis & Policy", tag: "Analysis" };
  }
  return { sentiment: "neutral", sentimentLabel: "Standard Dispatch", tag: "Wire" };
}

/**
 * Fetch and parse multi-source live publisher RSS wires
 */
export async function getLiveGoogleNews({ query, category = "general", country = "us", limit = 80 }) {
  const isSearch = query && query.trim().length > 0;
  const articles = [];
  const seenUrls = new Set();

  // If this is a search query, query Google News Search RSS
  if (isSearch) {
    const geo = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.us;
    const encoded = encodeURIComponent(query.trim());
    const searchUrl = `https://news.google.com/rss/search?q=${encoded}&hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;
    
    try {
      const searchArticles = await fetchSingleFeed(searchUrl, query, category, "Google Wire", limit);
      return searchArticles;
    } catch (err) {
      console.warn("Search RSS error:", err.message);
      return [];
    }
  }

  // Multi-Publisher Parallel Wire Aggregation
  const activeCategory = category && DIRECT_PUBLISHER_FEEDS[category] ? category : "general";
  const feedsToFetch = DIRECT_PUBLISHER_FEEDS[activeCategory] || DIRECT_PUBLISHER_FEEDS.general;

  // Add Google News category feed as backup
  const geo = COUNTRY_CONFIGS[country] || COUNTRY_CONFIGS.us;
  const topicCode = CATEGORY_TOPICS[activeCategory] || "WORLD";
  const googleTopicUrl = `https://news.google.com/rss/headlines/section/topic/${topicCode}?hl=${geo.hl}&gl=${geo.gl}&ceid=${geo.ceid}`;

  const feedPromises = feedsToFetch.map((f) =>
    fetchSingleFeed(f.url, "", f.cat, f.name, 25).catch(() => [])
  );

  // Include Google News Topic
  feedPromises.push(
    fetchSingleFeed(googleTopicUrl, "", activeCategory, "Global Wire", 20).catch(() => [])
  );

  const results = await Promise.allSettled(feedPromises);

  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const a of res.value) {
        if (a && a.url && !seenUrls.has(a.url)) {
          seenUrls.add(a.url);
          articles.push(a);
        }
      }
    }
  }

  return articles.slice(0, limit);
}

/**
 * Fetch and parse a single RSS feed URL
 */
async function fetchSingleFeed(url, query, category, defaultSource, limit = 30) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 NexaNews/2.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    return parseGoogleNewsXml(xml, query, category, defaultSource, limit);
  } catch (err) {
    console.warn(`Feed fetch notice (${url}):`, err.message);
    return [];
  }
}

/**
 * Parse RSS XML items using fast-xml-parser
 */
function parseGoogleNewsXml(xml, query, category, defaultSource, limit) {
  if (!xml || typeof xml !== "string") return [];

  let parsed;
  try {
    parsed = xmlParser.parse(xml);
  } catch (e) {
    return [];
  }

  const channel = parsed?.rss?.channel || parsed?.feed;
  if (!channel) return [];

  const rawItems = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : Array.isArray(channel.entry)
    ? channel.entry
    : channel.entry
    ? [channel.entry]
    : [];

  const articles = [];
  const seenTitles = new Set();

  for (let i = 0; i < rawItems.length; i++) {
    if (articles.length >= limit) break;

    try {
      const item = rawItems[i];
      if (!item) continue;

      const rawTitle = extractString(item.title);
      if (!rawTitle || rawTitle.includes("[Removed]")) continue;

      let link = extractString(item.link) || extractString(item.guid) || "";
      if (!link && item["@_href"]) link = item["@_href"];
      if (typeof item.link === "object" && item.link["@_href"]) link = item.link["@_href"];
      if (!link) continue;

      let cleanTitle = rawTitle;
      let sourceName = extractString(item.source) || defaultSource || "Global Wire";

      const dashIdx = rawTitle.lastIndexOf(" - ");
      if (dashIdx > 0 && sourceName === "Global Wire") {
        cleanTitle = rawTitle.substring(0, dashIdx).trim();
        sourceName = rawTitle.substring(dashIdx + 3).trim();
      }

      const normalizedTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
      if (seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);

      const rawDescription = extractString(item.description) || extractString(item.summary) || "";
      const cleanDesc = cleanHtmlContent(rawDescription, cleanTitle, sourceName);

      const pubDateStr = extractString(item.pubDate) || extractString(item.published) || extractString(item.updated);
      const publishedAt = pubDateStr && !isNaN(new Date(pubDateStr).getTime())
        ? new Date(pubDateStr).toISOString()
        : new Date().toISOString();

      const sourceId = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const resolvedCategory = inferCategoryFromText(cleanTitle, query, category);

      // Extract real image from media/enclosure/HTML tags
      const mediaUrl = extractMediaUrl(item);
      const imageUrl = mediaUrl || getDynamicArticleImage(cleanTitle, resolvedCategory, articles.length);
      const isStockImage = !mediaUrl;

      const { sentiment, sentimentLabel, tag } = analyzeSentimentAndTags(cleanTitle, cleanDesc);
      const readTime = calculateReadTime(`${cleanTitle} ${cleanDesc}`);

      const articlePayload = {
        source: { id: sourceId, name: sourceName },
        author: sourceName,
        title: cleanHtmlEntities(cleanTitle),
        description: cleanDesc,
        url: link,
        urlToImage: imageUrl,
        isStockImage,
        publishedAt,
        content: cleanDesc,
        category: resolvedCategory,
        sentiment,
        sentimentLabel,
        tag,
        readTime,
      };

      articlePayload.id = generateArticleId(articlePayload);
      articles.push(articlePayload);
    } catch (e) {
      continue;
    }
  }

  return articles;
}

function extractString(val) {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") {
    if (val.__cdata) return String(val.__cdata).trim();
    if (val["#text"]) return String(val["#text"]).trim();
  }
  return String(val).trim();
}

/**
 * Universal media URL extractor supporting Enclosures, Media RSS, and embedded HTML images
 */
function extractMediaUrl(item) {
  if (!item) return null;

  // 1. enclosure tag
  if (item.enclosure?.["@_url"]) {
    const type = item.enclosure["@_type"] || "";
    if (!type || type.startsWith("image/")) return item.enclosure["@_url"];
  }
  if (Array.isArray(item.enclosure)) {
    for (const enc of item.enclosure) {
      if (enc?.["@_url"]) return enc["@_url"];
    }
  }

  // 2. media:content
  if (item["media:content"]?.["@_url"]) return item["media:content"]["@_url"];
  if (Array.isArray(item["media:content"])) {
    for (const mc of item["media:content"]) {
      if (mc?.["@_url"]) return mc["@_url"];
    }
  }

  // 3. media:thumbnail (with HD resolution boost for BBC / Reuters)
  if (item["media:thumbnail"]?.["@_url"]) {
    return boostImageResolution(item["media:thumbnail"]["@_url"]);
  }
  if (Array.isArray(item["media:thumbnail"])) {
    for (const mt of item["media:thumbnail"]) {
      if (mt?.["@_url"]) return boostImageResolution(mt["@_url"]);
    }
  }

  // 4. Look inside description or content:encoded for <img src='...'>
  const desc = extractString(item.description);
  const content = extractString(item["content:encoded"]) || extractString(item.content);
  const imgMatch = (desc + " " + content).match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

function boostImageResolution(url) {
  if (!url || typeof url !== "string") return url;
  // Upgrade BBC thumbnail URLs from 240px/320px to 1024px high-res
  return url.replace(/\/240\//, "/1024/").replace(/\/320\//, "/1024/");
}

/**
 * Clean all HTML tags, URLs, and tracking parameters
 */
function cleanHtmlContent(rawHtml, title, sourceName) {
  if (!rawHtml) {
    return `Verified live intelligence report syndicated from ${sourceName}. Access complete coverage on official publisher wire.`;
  }

  let str = rawHtml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/[^\s]+/g, " ")
    .replace(/\b[0-9]{15,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  str = cleanHtmlEntities(str);

  if (!str || str.length < 20 || str.toLowerCase() === title.toLowerCase()) {
    return `Comprehensive live reporting and context published by ${sourceName}. Click to open complete dispatch.`;
  }

  return str;
}

export function cleanHtmlEntities(str) {
  if (!str) return "";

  const entityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#039;": "'",
    "&#39;": "'",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&laquo;": "«",
    "&raquo;": "»",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&bull;": "•",
    "&middot;": "·",
    "&pound;": "£",
    "&euro;": "€",
    "&yen;": "¥",
    "&cent;": "¢",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&deg;": "°",
    "&plusmn;": "±",
    "&times;": "×",
    "&divide;": "÷",
    "&nbsp;": " ",
    "&#8211;": "–",
    "&#8212;": "—",
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8230;": "…",
  };

  let cleaned = str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });

  for (const [entity, replacement] of Object.entries(entityMap)) {
    cleaned = cleaned.replaceAll(entity, replacement);
  }

  return cleaned.replace(/\s+/g, " ").trim();
}
