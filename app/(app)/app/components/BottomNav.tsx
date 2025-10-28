"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DietIcon, HistoryIcon, HomeIcon, ScanIcon } from "./Icons";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-background border-t" style={{ borderColor: "var(--background-3)" }}>
      <div className="grid grid-cols-4">
        <Link href="/app" className={`flex flex-col items-center py-2 ${isActive("/app") ? "text-text" : "text-text-2"}`}>
          <HomeIcon />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/app/history" className={`flex flex-col items-center py-2 ${isActive("/app/history") ? "text-text" : "text-text-2"}`}>
          <HistoryIcon />
          <span className="text-xs">History</span>
        </Link>
        <Link href="/app/scan" className={`flex flex-col items-center py-2 ${isActive("/app/scan") ? "text-text" : "text-text-2"}`}>
          <ScanIcon />
          <span className="text-xs">Scan</span>
        </Link>
        <Link href="/app/diet" className={`flex flex-col items-center py-2 ${isActive("/app/diet") ? "text-text" : "text-text-2"}`}>
          <DietIcon />
          <span className="text-xs">Diet</span>
        </Link>
      </div>
    </nav>
  );
}


