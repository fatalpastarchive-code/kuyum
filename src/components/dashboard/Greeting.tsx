"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";

export function Greeting() {
  const [greeting, setGreeting] = useState("Merhaba");
  const displayName = "Burak"; // Hardcoded for now until Clerk/Settings is connected

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Günaydın");
    else if (hour >= 12 && hour < 18) setGreeting("İyi günler");
    else if (hour >= 18 && hour < 22) setGreeting("İyi akşamlar");
    else setGreeting("İyi geceler");
  }, []);

  return (
    <div className="flex items-center justify-between py-2 mb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {greeting}, {displayName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          İşler nasıl gidiyor?
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
}
