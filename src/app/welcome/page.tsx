"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function WelcomePage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const settings = useQuery(api.settings.getSettings);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 4) {
      setPin(val);
      setError(false);

      if (val.length === 4) {
        verifyPin(val);
      }
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (!settings) return;
    
    if (enteredPin === settings.pin) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("unlockedDate", today);
      router.replace("/");
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-xs w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Kuyumcu Veresiye</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Hoşgeldiniz, lütfen şifrenizi girin.</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            value={pin}
            onChange={handlePinChange}
            disabled={!settings}
            className={`w-full text-center text-4xl tracking-[1em] font-mono py-4 px-4 bg-white dark:bg-slate-900 border-2 rounded-2xl shadow-sm focus:outline-none focus:ring-4 transition-all ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-500"
                : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 dark:text-slate-50"
            }`}
            placeholder="••••"
          />
          {error && (
            <p className="text-red-500 text-sm font-medium animate-bounce">
              Şifre hatalı, tekrar deneyin
            </p>
          )}
        </div>
        
        {!settings && (
          <p className="text-slate-400 text-sm animate-pulse">Yükleniyor...</p>
        )}
      </div>
    </div>
  );
}
