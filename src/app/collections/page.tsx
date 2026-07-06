"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, ArrowUpRight, ArrowDownRight, CalendarClock, AlertCircle, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useUnits } from "@/components/providers/UnitsProvider";
import { useState } from "react";
import { TransactionDetailModal } from "@/components/contacts/TransactionDetailModal";

export default function CollectionsPage() {
  const { getUnitLabel } = useUnits();
  const transactions = useQuery(api.transactions.getActiveTransactions);
  const contacts = useQuery(api.contacts.getContacts, {});
  const [selectedDetailTx, setSelectedDetailTx] = useState<any>(null);

  if (transactions === undefined || contacts === undefined) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Helper to get start of today
  const getStartOfDay = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Helper to get end of today
  const getEndOfDay = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  const startOfToday = getStartOfDay();
  const endOfToday = getEndOfDay();

  // Group transactions
  const overdue = transactions.filter(t => t.dueDate < startOfToday);
  const today = transactions.filter(t => t.dueDate >= startOfToday && t.dueDate <= endOfToday);
  const upcoming = transactions.filter(t => t.dueDate > endOfToday);

  // Sort upcoming ascending (closest first), overdue and today descending (newest first, or keep order)
  upcoming.sort((a, b) => a.dueDate - b.dueDate);
  overdue.sort((a, b) => a.dueDate - b.dueDate); // Oldest first to show most urgent? Usually descending is newest. Let's do oldest first for overdue (most urgent).

  const renderTransactionList = (list: typeof transactions, emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center text-sm text-slate-500 py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map(t => {
          const contact = contacts.find(c => c._id === t.contactId);
          const isVerecek = t.type === "verecek";
          return (
            <div
              key={t._id}
              onClick={() => setSelectedDetailTx(t)}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-semibold text-sm mb-1">{contact?.fullName || "Bilinmiyor"}</div>
                <div className="text-xs flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full ${isVerecek ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {isVerecek ? "Bize Borçlu" : "Biz Borçluyuz"}
                  </span>
                  <span className="text-slate-500">
                    Vade: {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={`font-bold flex items-center ${isVerecek ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {isVerecek ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                {t.amount.toLocaleString()} {getUnitLabel(t.unit)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32">
      <header className="pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Tahsilatlar</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Açık kayıtlar ve vadeler
        </p>
      </header>

      {/* Gecikmiş Kayıtlar */}
      {overdue.length > 0 && (
        <section className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-4">
          <h2 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" /> Gecikmiş
          </h2>
          {renderTransactionList(overdue, "Gecikmiş kayıt yok")}
        </section>
      )}

      {/* Bugün Vadesi Gelenler */}
      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <CalendarClock className="w-4 h-4" /> Bugün
        </h2>
        {renderTransactionList(today, "Bugün için vadesi gelen kayıt yok")}
      </section>

      {/* Yaklaşanlar */}
      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <CalendarDays className="w-4 h-4" /> Yaklaşan
        </h2>
        {renderTransactionList(upcoming, "Yaklaşan kayıt yok")}
      </section>

      {selectedDetailTx && (
        <TransactionDetailModal
          transaction={selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
        />
      )}
    </div>
  );
}
