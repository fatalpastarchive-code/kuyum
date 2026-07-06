"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserPlus, Search, ChevronRight, Loader2, ArrowUpRight, ArrowDownRight, Plus, User } from "lucide-react";
import Link from "next/link";
import { useUnits } from "@/components/providers/UnitsProvider";

export default function ContactsPage() {
  const { getUnitLabel } = useUnits();
  const [search, setSearch] = useState("");
  const contacts = useQuery(api.contacts.getContacts, { search: search || undefined });
  const transactions = useQuery(api.transactions.getActiveTransactions);

  // Calculate net balances for each contact (active transactions only)
  const balancesByContact = transactions?.reduce((acc, t) => {
    if (!acc[t.contactId]) acc[t.contactId] = {};
    if (!acc[t.contactId][t.unit]) {
      acc[t.contactId][t.unit] = { verecek: 0, alacak: 0 };
    }
    if (t.type === "verecek") {
      acc[t.contactId][t.unit].verecek += t.amount;
    } else {
      acc[t.contactId][t.unit].alacak += t.amount;
    }
    return acc;
  }, {} as Record<string, Record<string, { verecek: number; alacak: number }>>) ?? {};

  // A contact is "active" if they have at least one non-zero net balance unit
  const isActiveContact = (contactId: string) => {
    const unitBalances = balancesByContact[contactId];
    if (!unitBalances) return false;
    return Object.values(unitBalances).some(
      (b) => b.verecek - b.alacak !== 0
    );
  };

  // Only show contacts with non-zero balances in the main list
  const activeContacts = contacts?.filter((c) => isActiveContact(c._id));

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kişiler</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Müşterileriniz ve cari hesaplar
          </p>
        </div>
        <Link
          href="/new"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-sm transition-colors"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="İsim veya telefon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {contacts === undefined || transactions === undefined ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : activeContacts!.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            {search ? "Sonuç bulunamadı." : "Aktif bakiyesi olan kişi yok."}
          </div>
        ) : (
          activeContacts!.map((contact) => {
            const contactBalances = balancesByContact[contact._id] || {};
            const units = Object.keys(contactBalances);

            return (
              <Link
                key={contact._id}
                href={`/contacts/${contact._id}`}
                className="block bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{contact.fullName}</div>
                      <div className="text-xs text-slate-500">{contact.phone}</div>
                    </div>
                  </div>
                </div>

                {units.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {units.map((unit) => {
                      const net =
                        contactBalances[unit].verecek - contactBalances[unit].alacak;
                      const isVerecek = net > 0;

                      if (net === 0) return null;

                      return (
                        <div key={unit} className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">
                            {getUnitLabel(unit)}
                          </span>
                          <span
                            className={`font-bold flex items-center ${
                              isVerecek ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isVerecek ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                            {Math.abs(net).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
                    Aktif bakiye yok
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
