"use client";

import { useEffect, useRef, useState } from "react";
import { X, LogOut, UserRound, Eye, EyeOff, LoaderCircle, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { chronicleApi } from "@/lib/chronicleApi";

export default function AccountDrawer({ isOpen, onClose, user, onSignedIn, onSignedOut }) {
  const dialogRef = useRef(null);
  const pendingRef = useRef(false);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen) { dialog.close(); return; }
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const changeMode = (nextMode) => {
    if (pendingRef.current) return;
    setMode(nextMode); setNotice(null); setShowPassword(false);
    setForm((current) => ({ ...current, password: "" }));
  };
  const close = () => {
    if (!pendingRef.current) {
      setNotice(null); setShowPassword(false);
      setForm(current => ({ ...current, password: "" })); onClose();
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true; setPending(true); setNotice(null);
    try {
      if (mode === "reset") {
        await chronicleApi("auth/password-reset", { method: "POST", signal: AbortSignal.timeout(60000), body: JSON.stringify({ email: form.email.trim() }) });
        setNotice({ type: "success", text: "If an account matches that email, reset instructions have been sent. Check your inbox and spam folder." });
        return;
      }
      const payload = mode === "register" ? { ...form, username: form.username.trim(), email: form.email.trim() } : { username: form.username.trim(), password: form.password };
      const data = await chronicleApi(mode === "register" ? "auth/register" : "auth/login", { method: "POST", signal: AbortSignal.timeout(60000), body: JSON.stringify(payload) });
      setForm(current => ({ ...current, password: "" })); setShowPassword(false);
      if (mode === "register") {
        setMode("login");
        setNotice({ type: "success", text: "Account created! Sign in below to get started." });
      } else { onSignedIn(data.user); onClose(); }
    } catch (error) { setNotice({ type: "error", text: error.name === "TimeoutError" ? "The server is taking too long. Please try again in a moment." : error.message || "Something went wrong. Please try again." }); }
    finally { pendingRef.current = false; setPending(false); }
  };
  const signOut = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true; setPending(true); setNotice(null);
    try { await chronicleApi("auth/logout", { method: "POST", signal: AbortSignal.timeout(60000) }); onSignedOut(); onClose(); }
    catch (error) { setNotice({ type: "error", text: error.message }); }
    finally { pendingRef.current = false; setPending(false); }
  };
  const title = user ? "Your account" : mode === "register" ? "Join the Chronicle" : mode === "reset" ? "Forgot your password?" : "Welcome back";
  const action = mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in";
  const loadingLabel = user ? "Signing out…" : mode === "register" ? "Creating your account…" : mode === "reset" ? "Sending reset link…" : "Signing you in…";

  return <dialog ref={dialogRef} aria-labelledby="account-title" className="account-dialog" onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialogRef.current) close(); }}>
    <section className="account-panel" aria-busy={pending}>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#16834f]"><UserRound size={18} /> Chronicle Account</span>
        <button type="button" onClick={close} disabled={pending} aria-label="Close account" className="icon-button"><X size={20} /></button>
      </div>
      <div className="mt-8 mb-6"><h2 id="account-title" className="font-editorial text-3xl font-bold">{title}</h2>
        {!user && <p className="mt-2 text-sm leading-relaxed text-[#455c50]">{mode === "register" ? "Save stories you love and join the conversation." : mode === "reset" ? "Enter your email and we’ll help you get back in." : "Your saved stories and conversations, all in one place."}</p>}
      </div>
      {!user && <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#f0f5f2] p-1" aria-label="Account options">
        {[["login", "Sign in"], ["register", "Register"]].map(([value, label]) => <button key={value} type="button" disabled={pending} aria-pressed={mode === value} onClick={() => changeMode(value)} className={`min-h-11 rounded-lg text-sm font-semibold ${mode === value ? "bg-white text-[#16834f] shadow-sm" : "text-[#455c50]"}`}>{label}</button>)}
      </div>}
      {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`account-notice ${notice.type === "error" ? "account-error" : "account-success"}`}>
        {notice.type === "error" ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}<span>{notice.text}</span>
      </div>}
      {user ? <div className="space-y-5"><p className="text-sm text-[#455c50]">Signed in as <strong className="break-words">{user.username}</strong><span className="mt-2 block text-xs uppercase tracking-wider">{user.role}</span></p>
        {user.role !== "reader" && <p className="rounded-xl bg-[#f0f5f2] p-4 text-sm leading-relaxed text-[#455c50]">Open Publisher Studio to upload news. Submitted stories appear publicly after editorial approval.</p>}
        <button onClick={signOut} disabled={pending} className="auth-submit">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <LogOut size={18} />}{pending ? loadingLabel : "Sign out"}</button>
      </div> : <form onSubmit={submit}>
        <fieldset disabled={pending} className="space-y-5">
          {mode !== "reset" && <label className="auth-label" htmlFor="account-username">Username<input id="account-username" name="username" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} className="auth-input" placeholder="Your username" /></label>}
          {mode !== "login" && <label className="auth-label" htmlFor="account-email">Email address<input id="account-email" name="email" required type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="auth-input" placeholder="you@example.com" /></label>}
          {mode !== "reset" && <label className="auth-label" htmlFor="account-password">Password<div className="relative"><input id="account-password" name="password" required type={showPassword ? "text" : "password"} minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "register" ? "new-password" : "current-password"} aria-describedby={mode === "register" ? "password-hint" : undefined} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="auth-input pr-14" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="icon-button absolute right-1 top-1">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{mode === "register" && <span id="password-hint" className="text-xs font-normal text-[#455c50]">Use at least 8 characters.</span>}</label>}
          {mode === "login" && <button type="button" onClick={() => changeMode("reset")} className="min-h-11 text-sm font-semibold text-[#16834f]">Forgot password?</button>}
          <button type="submit" className="auth-submit">{pending ? <LoaderCircle size={20} className="animate-spin" /> : <ArrowRight size={18} />}{pending ? loadingLabel : action}</button>
        </fieldset>
      </form>}
      <div role="status" aria-live="polite" className="mt-4 text-center text-sm text-[#455c50]">{pending && <><span>{loadingLabel} Please keep this window open.</span><div className="auth-progress mt-3" aria-hidden="true"><span /></div></>}</div>
    </section>
  </dialog>;
}
