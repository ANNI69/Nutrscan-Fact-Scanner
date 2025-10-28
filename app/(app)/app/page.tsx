import { ProductsListLoading, Search, Welcome } from "@/(app)/components";
import { DietIcon, HistoryIcon, ScanIcon } from "./components/Icons";
import DietPlanner from "./components/DietPlanner";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import HistoryPage from "./history/page";

export default async function Home() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value || "User";

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-background p-4 border" style={{ borderColor: "var(--background-3)" }}>
        <h2 className="text-xl font-semibold">Welcome, {userName}</h2>
        <p className="text-sm text-text-2">Scan, compare and plan your meals quickly.</p>
        <div className="grid grid-cols-3 gap-3 pt-3">
          <Link href="/app/scan" className="border p-3 flex flex-col items-center" style={{ borderColor: "var(--background-3)" }}>
            <ScanIcon />
            <span className="text-sm">Scan</span>
          </Link>
          <Link href="/app/history" className="border p-3 flex flex-col items-center" style={{ borderColor: "var(--background-3)" }}>
            <HistoryIcon />
            <span className="text-sm">History</span>
          </Link>
          <Link href="/app/diet" className="border p-3 flex flex-col items-center" style={{ borderColor: "var(--background-3)" }}>
            <DietIcon />
            <span className="text-sm">Diet</span>
          </Link>
        </div>
      </div>
      <Search />
      <Suspense fallback={<ProductsListLoading />}>
        <HistoryPage />
      </Suspense>
      {/* <DietPlanner /> */}
    </div>
  );
}
