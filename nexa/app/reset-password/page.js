"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { chronicleApi } from "@/lib/chronicleApi";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const pendingRef = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (pendingRef.current || complete) return;
    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setNotice("");
    try {
      const data = await chronicleApi("auth/password-reset/confirm", {
        method: "POST",
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          uid: params.get("uid"),
          token: params.get("token"),
          password,
        }),
      });
      setNotice(data.detail);
      setComplete(true);
    } catch (error) {
      setNotice(error.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] p-6 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white border border-[#e1ece5] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#112117]">Reset password</h1>
        <p className="mt-2 text-sm text-[#455c50]">Choose a strong new Chronicle password.</p>
        <fieldset disabled={pending || complete} aria-busy={pending} className="mt-5 space-y-4">
          <label className="auth-label">New password<input required minLength="8" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input" placeholder="At least 8 characters" /></label>
          <label className="auth-label">Confirm new password<input required minLength="8" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="auth-input" placeholder="Re-enter your password" /></label>
          <button className="auth-submit">{pending && <LoaderCircle size={18} className="animate-spin" />}{pending ? "Updating password…" : complete ? "Password updated" : "Reset password"}</button>
        </fieldset>
        <p role="status" className="mt-3 text-sm text-[#455c50]">{pending ? "Updating your password. Please wait." : notice}</p>
        {complete && <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#16834f]">Back to the Chronicle to sign in →</Link>}
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f8faf9]" />}><ResetPasswordForm /></Suspense>;
}
