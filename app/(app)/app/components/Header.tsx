"use client";
import { Back } from "@/(app)/components";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon, DietIcon, HistoryIcon, HomeIcon, PantryIcon } from "./Icons";

function Header({
  initialUser,
}: {
  initialUser?: { id: string; email?: string; name?: string };
}) {
  const router = useRouter();
  const isHome = usePathname() === "/app";
  const [user, setUser] = useState<null | {
    id: string;
    email?: string;
    name?: string;
  }>(initialUser || null);

  const handleGoBack = () => {
    if (isHome) return;
    router.back();
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        setUser(data?.user || null);
      } catch {}
    })();
    const onAuthChanged = (e: any) => setUser(e.detail || null);
    window.addEventListener("auth:changed", onAuthChanged as any);
    return () =>
      window.removeEventListener("auth:changed", onAuthChanged as any);
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/app/login");
    } catch {}
  };

  return (
    <nav className="fixed z-10 top-0 flex items-center gap-2 w-full max-w-lg p-3 bg-background border-b" style={{ borderColor: "var(--background-3)" }}>
      <div className="w-9">
        {!isHome && (
          <button onClick={handleGoBack} className="p-2 focus:outline-none">
            <Back />
          </button>
        )}
      </div>
      <Link
        href="/app"
        className="grow flex items-center justify-center text-center"
      >
        {/* <Image
          src="/nutrition-facts-scanner-logo.png"
          alt="Nutri Scanner Logo"
          width="32"
          height="32"
          className="sm:w-10 sm:h-10 w-9 h-9"
        /> */}
        <h1 className="sm:text-2xl text-xl ml-2 tracking-tight">Nutri Scanner</h1>
      </Link>
      <div className="w-auto flex items-center gap-3">
        {/* <Link href="/app" className="text-text-2 hover:text-text" title="Home">
          <HomeIcon />
        </Link>
        <Link href="/app/history" className="text-text-2 hover:text-text" title="History">
          <HistoryIcon />
        </Link>
        <Link href="/app/diet" className="text-text-2 hover:text-text" title="Diet">
          <DietIcon />
        </Link> */}
        {/* <Link href="/app/pantry" className="text-text-2 hover:text-text" title="Pantry">
          <PantryIcon />
        </Link> */}
        <Link href="/app/shopping" className="text-text-2 hover:text-text" title="Shopping">
          <CartIcon />
        </Link>
        {!user ? (
          <Link href="/app/login" className="text-sm px-3 py-1 border" style={{ borderColor: "var(--background-3)" }}>
            Login
          </Link>
        ) : (
          <button onClick={logout} className="text-sm px-3 py-1 border" style={{ borderColor: "var(--background-3)" }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Header;
