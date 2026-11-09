import { Header } from "@/components/Header";
import { PlayerProvider } from "@/components/PlayerProvider";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="tech-bg" aria-hidden />
      <Header />
      <main className="relative">{children}</main>
    </PlayerProvider>
  );
}
