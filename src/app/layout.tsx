import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FPT Telecom – Play & Win",
  description: "Chơi hết mình – Khám phá công nghệ – Nhận quà từ FPT. 3 mini game: Perfect Stop, FPT Smart Quiz, Find the Difference.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "FPT TELECOM – PLAY & WIN",
    description: "Chơi hết mình – Khám phá công nghệ – Nhận quà từ FPT.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040a22",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
