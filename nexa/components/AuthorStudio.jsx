"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Pencil, PenLine, RotateCcw, Send, Trash2, X } from "lucide-react";
import { chronicleApi } from "@/lib/chronicleApi";

const emptyForm = { title: "", body: "", category: "general", cover_image: "", cover_image_file: null };

export default function AuthorStudio({ isOpen, onClose, user, onPublished }) {
  const [articles, setArticles] = useState([]);
  const [editorialQueue, setEditorialQueue] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const userRole = user?.role;

  const load = useCallback(async () => {
    try {
      setArticles(await chronicleApi("articles/mine"));
      if (userRole === "editor") setEditorialQueue(await chronicleApi("articles/editorial"));
    } catch (error) { setNotice(error.message); }
  }, [userRole]);
  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);
  if (!isOpen) return null;

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const save = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("body", form.body);
    payload.append("category", form.category);
    payload.append("cover_image", form.cover_image);
    if (form.cover_image_file) payload.append("cover_image_file", form.cover_image_file);
    try {
      await chronicleApi(editingId ? `articles/${editingId}` : "articles", {
        method: editingId ? "PATCH" : "POST",
        body: payload,
      });
      setNotice(editingId ? "Draft updated." : "Draft saved.");
      resetForm();
      load();
    } catch (error) { setNotice(error.message); }
  };
  const edit = (article) => {
    setEditingId(article.id);
    setForm({ title: article.title, body: article.body, category: article.category, cover_image: article.cover_image || "", cover_image_file: null });
    setNotice("");
  };
  const remove = async (id) => {
    try { await chronicleApi(`articles/${id}`, { method: "DELETE" }); resetForm(); setNotice("Draft deleted."); load(); }
    catch (error) { setNotice(error.message); }
  };
  const submit = async (id) => {
    try { await chronicleApi(`articles/${id}/submit`, { method: "POST" }); setNotice("Submitted to the editorial desk."); load(); }
    catch (error) { setNotice(error.message); }
  };
  const publish = async (id) => {
    try {
      await chronicleApi(`articles/${id}/publish`, { method: "POST" });
      setNotice("Article published and added to the public news feed.");
      await load();
      onPublished?.();
    } catch (error) { setNotice(error.message); }
  };
  const returnToDraft = async (id) => {
    try {
      await chronicleApi(`articles/${id}/return-to-draft`, { method: "POST" });
      setNotice("Article returned to the author as a draft.");
      await load();
    } catch (error) { setNotice(error.message); }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#112117]/40 p-4">
    <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#e1ece5] pb-4">
        <div><div className="flex items-center gap-2 font-bold text-[#112117]"><PenLine className="w-4 h-4 text-[#16834f]"/> Publisher Studio</div><p className="mt-1 text-xs text-[#738c7f]">Create original reporting, submit it, and track publication status.</p></div>
        <button onClick={onClose}><X className="w-5 h-5"/></button>
      </div>
      {user?.role === "editor" && <div className="mt-7 rounded-xl border border-[#a7ccb5] bg-[#f0f5f2] p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#16834f]">Editorial queue ({editorialQueue.length})</h3>
        <div className="mt-3 space-y-2">{editorialQueue.length === 0 ? <p className="text-xs text-[#455c50]">No submitted articles are waiting for approval.</p> : editorialQueue.map((article) => <div key={article.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 border border-[#e1ece5]">
          <div><p className="text-sm font-semibold text-[#112117]">{article.title}</p><p className="text-[10px] text-[#738c7f]">By {article.author?.username}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => returnToDraft(article.id)} className="flex items-center gap-1.5 rounded-lg border border-[#e1ece5] px-3 py-2 text-xs font-bold text-[#455c50]"><RotateCcw className="w-3.5 h-3.5"/> Return</button>
            <button type="button" onClick={() => publish(article.id)} className="flex items-center gap-1.5 rounded-lg bg-[#16834f] px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="w-3.5 h-3.5"/> Publish</button>
          </div>
        </div>)}</div>
      </div>}
      <form onSubmit={save} className="mt-5 grid gap-3">
        <input required value={form.title} onChange={(event) => setForm({...form, title: event.target.value})} placeholder="Headline" className="rounded-lg border border-[#e1ece5] p-2.5"/>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={form.category} onChange={(event) => setForm({...form, category: event.target.value})} placeholder="Category" className="rounded-lg border border-[#e1ece5] p-2.5"/>
          <input type="url" value={form.cover_image} onChange={(event) => setForm({...form, cover_image: event.target.value})} placeholder="Cover image URL (optional)" className="rounded-lg border border-[#e1ece5] p-2.5"/>
        </div>
        <label className="rounded-lg border border-dashed border-[#a7ccb5] bg-[#f8faf9] p-3 text-xs text-[#455c50]">
          Upload cover image (JPG, PNG, WebP or GIF, up to 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (file && file.size > 5 * 1024 * 1024) {
              setNotice("Cover images must be 5 MB or smaller.");
              event.target.value = "";
              setForm({...form, cover_image_file: null});
              return;
            }
            setNotice("");
            setForm({...form, cover_image_file: file});
          }} className="mt-2 block w-full"/>
        </label>
        <textarea required minLength="20" value={form.body} onChange={(event) => setForm({...form, body: event.target.value})} placeholder="Write your original reporting…" className="min-h-32 rounded-lg border border-[#e1ece5] p-2.5"/>
        <div className="flex gap-2">
          <button className="rounded-lg bg-[#16834f] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">{editingId ? "Update draft" : "Save draft"}</button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-[#e1ece5] px-4 py-2 text-xs font-semibold">Cancel</button>}
        </div>
      </form>
      {notice && <p className="mt-3 text-xs text-[#455c50]">{notice}</p>}
      <div className="mt-7 border-t border-[#e1ece5] pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#455c50]">Your reporting</h3>
        <div className="mt-3 space-y-2">{articles.map((article) => <div key={article.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e1ece5] p-3">
          <div><p className="text-sm font-semibold text-[#112117]">{article.title}</p><p className="text-[10px] uppercase tracking-wider text-[#738c7f]">{article.status}</p></div>
          {article.status === "draft" && <div className="flex items-center gap-2">
            <button type="button" onClick={() => edit(article)} title="Edit draft" className="text-[#455c50]"><Pencil className="w-3.5 h-3.5"/></button>
            <button type="button" onClick={() => remove(article.id)} title="Delete draft" className="text-[#b91c1c]"><Trash2 className="w-3.5 h-3.5"/></button>
            <button type="button" onClick={() => submit(article.id)} className="flex items-center gap-1 text-xs font-semibold text-[#16834f]"><Send className="w-3.5 h-3.5"/> Submit</button>
          </div>}
        </div>)}</div>
      </div>
    </div>
  </div>;
}
