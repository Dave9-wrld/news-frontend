"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { chronicleApi } from "@/lib/chronicleApi";

export default function ArticleDiscussion({ article, user, onRequireSignIn }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const isOriginal = article?.kind === "original" || String(article?.id || "").startsWith("original-");
  const articleId = article?.article_id || String(article?.id || "").replace("original-", "");
  const externalId = article?.external_id || article?.id;
  useEffect(() => {
    if (!article) return;
    const query = isOriginal ? `comments?article_id=${articleId}` : `comments?external_id=${encodeURIComponent(externalId)}`;
    chronicleApi(query).then(setComments).catch(() => setComments([]));
  }, [article, isOriginal, articleId, externalId]);
  const submit = async (event) => {
    event.preventDefault(); if (!user) return onRequireSignIn();
    try {
      const payload = isOriginal ? { kind: "original", article_id: articleId, body } : { kind: "external", body, external: { external_id: externalId, provider: article.provider || "external", url: article.url, title: article.title, description: article.description || "", source: article.source, category: article.category } };
      const comment = await chronicleApi("comments", { method: "POST", body: JSON.stringify(payload) });
      setComments([comment, ...comments]); setBody(""); setError("");
    } catch (err) { setError(err.message); }
  };
  const remove = async (comment) => { await chronicleApi(`comments/${comment.id}`, { method: "DELETE" }); setComments(comments.filter((item) => item.id !== comment.id)); };
  return <section className="mt-7 pt-6 border-t border-[#e1ece5]"><div className="flex gap-2 items-center text-xs font-bold uppercase tracking-wider text-[#16834f]"><MessageCircle className="w-4 h-4"/> Reader discussion ({comments.length})</div>
    <form onSubmit={submit} className="mt-3 flex gap-2"><input value={body} onChange={e => setBody(e.target.value)} required maxLength="2000" placeholder={user ? "Add a thoughtful comment…" : "Sign in to join the discussion"} onFocus={() => !user && onRequireSignIn()} className="min-w-0 flex-1 rounded-lg border border-[#e1ece5] px-3 py-2 text-sm"/><button className="rounded-lg bg-[#16834f] px-3 text-xs font-bold text-white">Post</button></form>
    {error && <p className="mt-2 text-xs text-[#b91c1c]">{error}</p>}<div className="mt-4 space-y-3">{comments.map(comment => <div key={comment.id} className="rounded-lg bg-[#f8faf9] p-3 text-sm"><div className="flex justify-between gap-3"><span className="text-xs font-semibold text-[#455c50]">{comment.user?.username}</span>{(user?.id === comment.user?.id || user?.role === "editor") && <button onClick={() => remove(comment)} className="text-[#b91c1c]"><Trash2 className="w-3.5 h-3.5"/></button>}</div><p className="mt-1 text-[#112117]">{comment.body}</p></div>)}</div>
  </section>;
}
