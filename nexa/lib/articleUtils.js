/**
 * Utility functions for Article IDs, Slugs, and Metadata Encoding
 */

export function generateArticleId(article) {
  if (!article) return "";
  
  // If article has explicit mock ID from fallback pool, preserve it
  if (article.id && typeof article.id === "string" && !article.id.startsWith("eyJ") && article.isFallback) {
    return article.id;
  }

  const payload = {
    u: article.url || "",
    t: article.title || "",
    s: article.source?.name || "",
    sid: article.source?.id || "",
    c: article.category || "general",
    d: article.publishedAt || "",
    img: article.urlToImage || "",
    desc: article.description ? article.description.slice(0, 400) : "",
    cnt: article.content ? article.content.slice(0, 500) : "",
  };

  const jsonStr = JSON.stringify(payload);
  
  if (typeof Buffer !== "undefined") {
    return Buffer.from(jsonStr, "utf-8").toString("base64url");
  }
  
  try {
    return btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
}

export function decodeArticleId(id) {
  if (!id || typeof id !== "string") return null;

  try {
    let jsonStr = "";
    if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(id, "base64url").toString("utf-8");
    } else {
      const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
      jsonStr = decodeURIComponent(escape(atob(base64)));
    }

    if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
      const data = JSON.parse(jsonStr);
      if (data.t || data.u) {
        return {
          id,
          title: data.t || "News Report",
          description: data.desc || data.cnt || "Official news report accessed via live reporting stream.",
          content: data.cnt || data.desc || "Complete coverage published directly by official source.",
          url: data.u || "",
          urlToImage: data.img || null,
          source: { id: data.sid || "global-news", name: data.s || "Global News" },
          publishedAt: data.d || new Date().toISOString(),
          category: data.c || "general",
          readTime: calculateReadTime(`${data.t} ${data.desc || ""}`),
        };
      }
    }

    // Direct URL check
    if (jsonStr.startsWith("http://") || jsonStr.startsWith("https://")) {
      return {
        id,
        title: "News Report",
        description: "Official news report accessed via live reporting stream.",
        content: "Complete coverage published directly by official source.",
        url: jsonStr,
        source: { id: "global-news", name: "Global News" },
        publishedAt: new Date().toISOString(),
        category: "general",
      };
    }
  } catch {
    // Non-base64 ID
  }

  return null;
}

export function generateArticleSlug(title = "") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatPublishedDate(dateStr) {
  if (!dateStr) return "Recently Published";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently Published";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recently Published";
  }
}

export function calculateReadTime(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes}m read`;
}
