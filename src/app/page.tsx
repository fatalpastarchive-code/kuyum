"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { Greeting } from "@/components/dashboard/Greeting";
import { ExchangeRates } from "@/components/dashboard/ExchangeRates";
import { DueToday } from "@/components/dashboard/DueToday";
import Link from "next/link";
import { useUnits } from "@/components/providers/UnitsProvider";

export default function Dashboard() {
  const { getUnitLabel } = useUnits();
  const transactions = useQuery(api.transactions.getActiveTransactions);
  const contacts = useQuery(api.contacts.getContacts, {});

  if (transactions === undefined || contacts === undefined) {
    return (
      <div className="flex h-[calc(100dvh-64px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate summaries by unit
  const summaries = transactions.reduce((acc, t) => {
    if (!acc[t.unit]) {
      acc[t.unit] = { verecek: 0, alacak: 0 };
    }
    if (t.type === "verecek") {
      acc[t.unit].verecek += t.amount;
    } else {
      acc[t.unit].alacak += t.amount;
    }
    return acc;
  }, {} as Record<string, { verecek: number; alacak: number }>);

  const units = Object.keys(summaries);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* 2.1 Selamlama ve Tema Butonu */}
      <Greeting />

      {/* 2.2 Kur Kartları */}
      <ExchangeRates />

      {/* 2.3 Bugün Vadesi Gelenler */}
      <DueToday />

      {/* 2.4 Genel Özet Kartları */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold">Genel Bakiye Özeti</h2>
        {units.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            Henüz aktif kayıt yok
          </div>
        ) : (
          units.map((unit) => {
            const data = summaries[unit];
            return (
              <div
                key={unit}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
              >
                <div className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-2">
                  {getUnitLabel(unit)}
                </div>
                <div className="flex justify-between gap-4">
                  <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center text-green-700 dark:text-green-400 text-sm font-medium mb-1">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      Bize Borçlu
                    </div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                      {data.verecek.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center text-red-700 dark:text-red-400 text-sm font-medium mb-1">
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                      Biz Borçluyuz
                    </div>
                    <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                      {data.alacak.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Son Hareketler */}
      <section className="pt-2 space-y-4">
        <h2 className="text-lg font-bold">Son Hareketler</h2>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((t) => {
            const contact = contacts.find((c) => c._id === t.contactId);
            const isVerecek = t.type === "verecek";
            return (
              <Link
                href={`/contacts/${t.contactId}`}
                key={t._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      isVerecek
                        ? "p-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full"
                        : "p-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full"
                    }
                  >
                    {isVerecek ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {contact?.fullName || "Bilinmiyor"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(t.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    isVerecek
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isVerecek ? "+" : "-"}
                  {t.amount.toLocaleString()} {getUnitLabel(t.unit)}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
