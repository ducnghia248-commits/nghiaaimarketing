"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/login", { username, password });
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin grid min-h-dvh place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-7 shadow-xl">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/fpt-telecom-logo.webp" alt="FPT Telecom" className="mb-3 h-10 w-auto" />
          <div className="text-xs font-bold uppercase tracking-widest text-[#1369b4]">Play & Win</div>
          <h1 className="mt-1 text-2xl font-black">Đăng nhập quản trị</h1>
        </div>
        <label className="block text-sm font-semibold">
          Tên đăng nhập
          <input className="mt-1 w-full" value={username} onChange={(e) => setU(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label className="block text-sm font-semibold">
          Mật khẩu
          <input className="mt-1 w-full" type="password" value={password} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#1369b4] py-2.5 font-bold text-white hover:brightness-110 disabled:opacity-50">
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
