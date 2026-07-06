"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";

type RateData = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

const MOCK_GOLD_TRY = 2450.50; // Mock Gram Gold price

export function ExchangeRates() {
  const [usdTry, setUsdTry] = useState<number | null>(null);
  const [eurTry, setEurTry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) throw new Error("API hatası");
        const data = await res.json();
        setUsdTry(data.rates.TRY);
        setEurTry(data.rates.TRY / data.rates.EUR); // Cross rate calculation
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center">
          <TrendingUp className="w-4 h-4 mr-1" /> Güncel Kurlar
        </h2>
        {loading && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
      </div>
      
      {error ? (
        <div className="text-sm text-red-500 py-2">Kur verisi alınamadı</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">USD/TL</div>
            <div className="font-semibold">{usdTry ? usdTry.toFixed(2) : "..."}</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">EUR/TL</div>
            <div className="font-semibold">{eurTry ? eurTry.toFixed(2) : "..."}</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <div className="text-xs text-amber-700 dark:text-amber-500 mb-1">Gram Altın</div>
            <div className="font-semibold text-amber-800 dark:text-amber-400">{MOCK_GOLD_TRY.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
