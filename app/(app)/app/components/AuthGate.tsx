"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // Do not guard auth pages
      if (
        pathname?.startsWith("/app/login") ||
        pathname?.startsWith("/app/register")
      ) {
        setChecking(false);
        return;
      }
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!data?.user) {
          const redirect = encodeURIComponent(pathname || "/app");
          router.replace(`/app/login?redirect=${redirect}`);
          return;
        }
      } catch {}
      setChecking(false);
    })();
  }, [pathname, router]);

  if (checking) return <div className="p-4">Loading...</div>;
  return <>{children}</>;
}
