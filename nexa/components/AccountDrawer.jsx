"use client";

import { useState } from "react";
import { X, LogOut, UserRound } from "lucide-react";
import { chronicleApi } from "@/lib/chronicleApi";

export default function AccountDrawer({ isOpen, onClose, user, onSignedIn, onSignedOut }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [notice, setNotice] = useState("");
  if (!isOpen) return null;
  const submit = async (event) => {
    event.preventDefault(); setNotice("");
    try {
      if (mode === "reset") {
        await chronicleApi("auth/password-reset", { method: "POST", body: JSON.stringify({ email: form.email }) });
        setNotice("If an account matches, reset instructions have been sent."); return;
      }
      const endpoint = mode === "register" ? "auth/register" : "auth/login";
      const payload = mode === "register" ? form : { username: form.username, password: form.password };
      const data = await chronicleApi(endpoint, { method: "POST", body: JSON.stringify(payload) });
      if (mode === "register") {
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
        setNotice("Account created. Sign in to upload your first news story.");
        return;
      }
      onSignedIn(data.user); onClose();
    } catch (error) { setNotice(error.message); }
  };
  const signOut = async () => { try { await chronicleApi("auth/logout", { method: "POST" }); } finally { onSignedOut(); onClose(); } };
  return <div className="fixed inset-0 z-50"><div onClick={onClose} className="absolute inset-0 bg-[#112117]/40"/><aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl p-6 border-l border-[#e1ece5]">
    <div className="flex items-center justify-between border-b border-[#e1ece5] pb-4"><div className="flex gap-2 items-center font-bold text-[#112117]"><UserRound className="w-4 h-4 text-[#16834f]"/> Chronicle Account</div><button onClick={onClose}><X className="w-5 h-5"/></button></div>
    {user ? <div className="pt-6 space-y-4"><p className="text-sm text-[#455c50]">Signed in as <strong className="text-[#112117]">{user.username}</strong><br/><span className="uppercase text-[10px] tracking-wider text-[#16834f]">{user.role}</span></p>{user.role !== "reader" && <p className="rounded-lg border border-[#a7ccb5] bg-[#f0f5f2] p-3 text-xs leading-relaxed text-[#455c50]">You can upload news from <strong className="text-[#16834f]">Publisher Studio</strong>. Submitted stories appear publicly after editorial approval.</p>}<button onClick={signOut} className="flex items-center gap-2 text-xs font-semibold text-[#b91c1c]"><LogOut className="w-4 h-4"/> Sign out</button></div> : <form onSubmit={submit} className="pt-6 space-y-3">
      <div className="flex gap-2 text-xs"><button type="button" onClick={() => setMode("login")} className={mode === "login" ? "text-[#16834f] font-bold" : "text-[#738c7f]"}>Sign in</button><button type="button" onClick={() => setMode("register")} className={mode === "register" ? "text-[#16834f] font-bold" : "text-[#738c7f]"}>Register</button></div>
      {mode === "register" && <p className="rounded-lg bg-[#f0f5f2] p-3 text-xs leading-relaxed text-[#455c50]">Every registered account can upload original news, submit it for review, and join discussions.</p>}
      {mode !== "reset" && <input required placeholder="Username" value={form.username} onChange={e => setForm({...form, username:e.target.value})} className="w-full rounded-lg border border-[#e1ece5] p-2.5 text-sm"/>}
      {mode !== "login" && <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="w-full rounded-lg border border-[#e1ece5] p-2.5 text-sm"/>}
      {mode !== "reset" && <input required type="password" minLength="8" placeholder="Password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="w-full rounded-lg border border-[#e1ece5] p-2.5 text-sm"/>}
      {notice && <p className="text-xs text-[#455c50]">{notice}</p>}<button className="w-full rounded-lg bg-[#16834f] py-2.5 text-xs font-bold uppercase tracking-wider text-white">{mode === "reset" ? "Send reset link" : mode === "register" ? "Create account" : "Sign in"}</button>
      {mode === "login" && <button type="button" onClick={() => setMode("reset")} className="text-xs text-[#16834f]">Forgot password?</button>}
    </form>}
  </aside></div>;
}
