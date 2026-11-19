import { notFound } from "next/navigation";
import { cache } from "react";
import ArticleReaderView from "@/components/ArticleReaderView";
import { SITE_NAME } from "@/lib/site";

const BACKEND_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

async function fetchBackend(path) {
  try {
    const response = await fetch(`${BACKEND_URL}/${path}`, { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

const findArticleById = cache(async (id) => {
  if (!id) return null;

  if (/^original-\d+$/.test(id)) {
    const article = await fetchBackend(`articles/${id.replace("original-", "")}/`);
    if (article) {
      const uploadedCover = article.cover_image_file
        ? new URL(article.cover_image_file, BACKEND_URL).toString()
        : "";
      return {
        id,
        kind: "original",
        article_id: article.id,
        title: article.title,
        description: article.body.slice(0, 500),
        content: article.body,
        url: `/article/${id}`,
        urlToImage: uploadedCover || article.cover_image,
        source: { id: "the-global-chronicle", name: "The Global Chronicle" },
        author: article.author?.username,
        publishedAt: article.published_at || article.created_at,
        category: article.category,
        comment_count: article.comment_count,
        bookmarked: article.bookmarked,
      };
    }
  }

  if (/^ext_[A-Za-z0-9_-]{1,120}$/.test(id)) {
    const article = await fetchBackend(`external-articles/${id}/`);
    if (article) {
      return {
        ...article,
        id: article.external_id || article.id || id,
        external_id: article.external_id || article.id || id,
        kind: "external",
        url: article.url || article.canonical_url || "",
        urlToImage: article.urlToImage || article.image_url || "",
        source: article.source || { id: article.provider, name: article.source_name || article.provider || "External" },
        publishedAt: article.publishedAt || article.published_at || "",
      };
    }
  }
  return null;
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await findArticleById(id);

  if (!article) {
    return {
      title: `Article Not Found | ${SITE_NAME}`,
      description: "The requested article could not be located.",
    };
  }

  return {
    title: `${article.title} | ${SITE_NAME}`,
    description: article.description || "Live international news reporting.",
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      images: article.urlToImage ? [{ url: article.urlToImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: article.urlToImage ? [article.urlToImage] : [],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const article = await findArticleById(id);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#f8faf9] text-[#112117]">
      <ArticleReaderView article={article} />
    </main>
  );
}
