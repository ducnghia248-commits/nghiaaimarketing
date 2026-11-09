"use client";
import { usePlayer } from "./PlayerProvider";

export const DEFAULT_LOGO = "/brand/fpt-telecom-logo.webp";

/**
 * Logo FPT Telecom chính thức, đặt trên nền trắng bo góc để giữ đúng màu thương hiệu trên nền tối.
 * Có thể thay tại Admin → Thương hiệu & 3D.
 */
export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const { branding } = usePlayer();
  const h = { sm: "h-6", md: "h-7 sm:h-8", lg: "h-12 sm:h-16" }[size];
  const pad = { sm: "px-2 py-1", md: "px-2.5 py-1.5", lg: "px-4 py-2.5 sm:px-5 sm:py-3" }[size];
  return (
    <span className={`inline-flex items-center rounded-xl bg-white shadow-[0_6px_24px_-8px_rgba(19,105,180,.7)] ${pad} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={branding.logoUrl ?? DEFAULT_LOGO} alt="FPT Telecom" className={`${h} w-auto`} />
    </span>
  );
}
