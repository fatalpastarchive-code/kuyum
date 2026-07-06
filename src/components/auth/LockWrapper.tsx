"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function LockWrapper({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split("T")[0];
    const unlockedDate = localStorage.getItem("unlockedDate");

    if (unlockedDate === today) {
      setIsLocked(false);
    } else {
      setIsLocked(true);
      if (pathname !== "/welcome") {
        router.replace("/welcome");
      }
    }
  }, [router, pathname]);

  if (!mounted || (isLocked && pathname !== "/welcome")) {
    // Return null or a blank screen while checking to prevent flash of content
    return <div className="h-full w-full bg-slate-50 dark:bg-slate-950" />;
  }

  return <>{children}</>;
}
