"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { chronicleApi } from "@/lib/chronicleApi";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    try {
      const data = await chronicleApi("auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({
          uid: params.get("uid"),
          token: params.get("token"),
          password,
        }),
      });
      setNotice(data.detail);
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] p-6 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white border border-[#e1ece5] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#112117]">Reset password</h1>
        <p className="mt-2 text-sm text-[#455c50]">Choose a strong new Chronicle password.</p>
        <input required minLength="8" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-5 w-full rounded-lg border border-[#e1ece5] p-2.5" placeholder="New password" />
        <input required minLength="8" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-3 w-full rounded-lg border border-[#e1ece5] p-2.5" placeholder="Confirm new password" />
        <button className="mt-3 w-full rounded-lg bg-[#16834f] py-2.5 text-xs font-bold uppercase tracking-wider text-white">Reset password</button>
        {notice && <p className="mt-3 text-xs text-[#455c50]">{notice}</p>}
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f8faf9]" />}><ResetPasswordForm /></Suspense>;
}
