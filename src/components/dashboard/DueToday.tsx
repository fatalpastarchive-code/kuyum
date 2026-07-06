"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CalendarClock, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useUnits } from "@/components/providers/UnitsProvider";
import Link from "next/link";

export function DueToday() {
  const { getUnitLabel } = useUnits();
  const dueToday = useQuery(api.transactions.getDueToday);
  const contacts = useQuery(api.contacts.getContacts, {});

  if (dueToday === undefined || contacts === undefined) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center text-slate-700 dark:text-slate-300">
        <CalendarClock className="w-4 h-4 mr-2" /> Bugün Vadesi Gelenler
      </h2>

      {dueToday.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          Bugün için vadesi gelen bir kayıt yok 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {dueToday.map((t) => {
            const contact = contacts.find((c) => c._id === t.contactId);
            const isVerecek = t.type === "verecek";
            
            return (
              <Link
                href={`/contacts/${t.contactId}`}
                key={t._id}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
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
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {contact?.fullName || "Bilinmiyor"}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-bold text-sm ${
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
      )}
    </div>
  );
}
