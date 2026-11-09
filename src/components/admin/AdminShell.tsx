"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { api } from "@/lib/client/api";

type Admin = { username: string; role: "admin" | "editor" };
const AdminCtx = createContext<Admin | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

const NAV = [
  { href: "/admin", label: "Thá»‘ng kÃª", icon: "ðŸ“Š" },
  { href: "/admin/games", label: "Quáº£n lÃ½ game", icon: "ðŸŽ®" },
  { href: "/admin/questions", label: "CÃ¢u há»i Quiz", icon: "â“" },
  { href: "/admin/puzzles", label: "TÃ¬m Ä‘iá»ƒm khÃ¡c biá»‡t", icon: "ðŸ–¼ï¸" },
  { href: "/admin/campaigns", label: "Chiáº¿n dá»‹ch & QR", icon: "ðŸ“£" },
  { href: "/admin/players", label: "NgÆ°á»i tham gia", icon: "ðŸ‘¥" },
  { href: "/admin/leads", label: "KhÃ¡ch hÃ ng tÆ° váº¥n", icon: "ðŸ“‡", role: "admin" },
  { href: "/admin/settings", label: "ThÆ°Æ¡ng hiá»‡u & 3D", icon: "ðŸŽ¨" },
  { href: "/admin/system", label: "Dá»¯ liá»‡u & nháº­t kÃ½", icon: "ðŸ›¡ï¸", role: "admin" },
];

export function AdminShell({ admin, children }: { admin: Admin; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = async () => {
    await api("/api/admin/logout", {});
    router.replace("/admin/login");
  };
  return (
    <AdminCtx.Provider value={admin}>
      <div className="admin flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 bg-[#071240] text-white transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-5 py-5">
            <span className="inline-flex rounded-lg bg-white px-2 py-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/fpt-telecom-logo.webp" alt="FPT Telecom" className="h-7 w-auto" />
            </span>
            <div className="mt-2 text-lg font-black">Play & Win Â· Admin</div>
          </div>
          <nav className="space-y-0.5 px-3">
            {NAV.filter((n) => !n.role || n.role === admin.role).map((n) => {
              const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-white/15" : "text-white/75 hover:bg-white/10"}`}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4 text-sm">
            <div className="font-bold">{admin.username}</div>
            <div className="text-xs text-white/60">{admin.role === "admin" ? "Quáº£n trá»‹ viÃªn" : "BiÃªn táº­p (Marketing)"}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <a href="/" target="_blank" className="text-cyan-300 hover:underline">Xem trang game â†—</a>
              <button onClick={logout} className="text-rose-300 hover:underline">ÄÄƒng xuáº¥t</button>
            </div>
          </div>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <button onClick={() => setOpen(true)} className="rounded-md border px-2 py-1">â˜°</button>
            <span className="font-bold">Play & Win Admin</span>
          </div>
          <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

export function PageTitle({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Btn({ variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "orange" }) {
  const v = {
    primary: "bg-[#1369b4] text-white hover:brightness-110",
    orange: "bg-[#f07629] text-white hover:brightness-110",
    ghost: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:brightness-110",
  }[variant];
  return <button {...p} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`} />;
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok" | "warn"; children: React.ReactNode }) {
  const c = { info: "bg-blue-50 text-blue-800", error: "bg-rose-50 text-rose-700", ok: "bg-emerald-50 text-emerald-700", warn: "bg-amber-50 text-amber-800" }[kind];
  return <div className={`rounded-lg px-3 py-2 text-sm ${c}`}>{children}</div>;
}
