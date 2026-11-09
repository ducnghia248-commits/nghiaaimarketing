"use client";
import { useRef } from "react";
import { sfx } from "@/lib/client/sound";

type Variant = "primary" | "blue" | "ghost" | "danger";
const styles: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-fpt-orange-light to-fpt-orange text-white orange-glow hover:brightness-110",
  blue: "bg-gradient-to-b from-fpt-blue-light to-fpt-blue text-white blue-glow hover:brightness-110",
  ghost: "glass text-white hover:bg-white/15",
  danger: "bg-gradient-to-b from-rose-400 to-rose-600 text-white hover:brightness-110",
};

/** Nút bấm có trạng thái hover / press / ripple / âm thanh. */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  onPointerDown,
  onClick,
  silent,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" | "xl"; silent?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const sz = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-base", lg: "px-8 py-4 text-lg", xl: "px-10 py-5 text-xl" }[size];
  return (
    <button
      ref={ref}
      {...rest}
      onPointerDown={(e) => {
        const el = ref.current;
        if (el && !rest.disabled) {
          const r = el.getBoundingClientRect();
          const d = Math.max(r.width, r.height);
          const dot = document.createElement("span");
          dot.className = "ripple-dot";
          dot.style.width = dot.style.height = `${d}px`;
          dot.style.left = `${e.clientX - r.left - d / 2}px`;
          dot.style.top = `${e.clientY - r.top - d / 2}px`;
          el.appendChild(dot);
          setTimeout(() => dot.remove(), 650);
        }
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        if (!silent) sfx.click();
        onClick?.(e);
      }}
      className={`relative select-none overflow-hidden rounded-2xl font-extrabold tracking-wide transition-[transform,filter,box-shadow] duration-150
        active:translate-y-0.5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon
        ${styles[variant]} ${sz} ${className}`}
    >
      {children}
    </button>
  );
}
