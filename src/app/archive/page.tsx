"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Phone,
  User,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getStatusLabel } from "@/lib/units";
import { useUnits } from "@/components/providers/UnitsProvider";
import { Id } from "../../../convex/_generated/dataModel";
import { TransactionDetailModal } from "@/components/contacts/TransactionDetailModal";

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-().]/g, "");
  if (normalized.startsWith("0")) {
    normalized = "+90" + normalized.slice(1);
  }
  return normalized;
}

function ArchivedContactDetail({
  contactId,
  onBack,
}: {
  contactId: Id<"contacts">;
  onBack: () => void;
}) {
  const contact = useQuery(api.contacts.getContactById, { id: contactId });
  const transactions = useQuery(api.transactions.getTransactionsByContact, {
    contactId,
  });
  const { getUnitLabel } = useUnits();
  const [selectedDetailTx, setSelectedDetailTx] = useState<any>(null);

  if (contact === undefined || transactions === undefined) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center text-slate-500">Kişi bulunamadı.</div>
    );
  }

  const telHref = `tel:${normalizePhone(contact.phone)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{contact.fullName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-slate-500">{contact.phone}</p>
            <a
              href={telHref}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              aria-label={`${contact.fullName} kişisini ara`}
            >
              <Phone className="w-3 h-3" />
              Ara
            </a>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-medium">
          Arşivlendi
        </span>
      </header>

      {/* Read-only transaction history */}
      <section>
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Archive className="w-4 h-4" /> Tüm İşlem Geçmişi
        </h3>

        {transactions.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Bu kişiye ait işlem kaydı bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const isVerecek = t.type === "verecek";
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedDetailTx(t)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span
                        className={
                          isVerecek
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {isVerecek ? "Bize Borçlu" : "Biz Borçluyuz"}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Vade: {new Date(t.dueDate).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <div
                    className={`font-bold flex items-center text-sm ${
                      isVerecek
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isVerecek ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {t.amount.toLocaleString()} {getUnitLabel(t.unit)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transaction Detail Modal (read-only: no payment entry since transaction.status === "odendi") */}
      {selectedDetailTx && (
        <TransactionDetailModal
          transaction={selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
        />
      )}
    </div>
  );
}

export default function ArchivePage() {
  const contacts = useQuery(api.contacts.getContacts, {});
  const transactions = useQuery(api.transactions.getActiveTransactions);
  const deleteContact = useMutation(api.contacts.deleteContact);
  const [selectedContactId, setSelectedContactId] =
    useState<Id<"contacts"> | null>(null);

  const handleDeleteContact = async (e: React.MouseEvent, id: Id<"contacts">) => {
    e.stopPropagation();
    if (!window.confirm("Bu kişiyi ve tüm işlem geçmişini kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      await deleteContact({ id });
      toast.success("Kişi başarıyla silindi");
      if (selectedContactId === id) setSelectedContactId(null);
    } catch (err) {
      console.error(err);
      toast.error("Kişi silinirken hata oluştu");
    }
  };

  if (contacts === undefined || transactions === undefined) {
    return (
      <div className="flex h-[calc(100dvh-64px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Build set of contact IDs that have at least one active (non-zero) transaction
  const activeContactIds = new Set(transactions.map((t) => t.contactId));

  // Archived contacts = all contacts NOT in active set
  const archivedContacts = contacts.filter(
    (c) => !activeContactIds.has(c._id)
  );

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32">
      {selectedContactId ? (
        <ArchivedContactDetail
          contactId={selectedContactId}
          onBack={() => setSelectedContactId(null)}
        />
      ) : (
        <>
          <header className="pt-4">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="w-6 h-6 text-slate-400" />
              Arşiv
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tüm borçları kapanmış kişiler
            </p>
          </header>

          {archivedContacts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <Archive className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Arşivde kişi yok</p>
              <p className="text-slate-400 text-sm mt-1">
                Tüm borçları kapanan kişiler burada görünür.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedContacts.map((contact) => (
                <div key={contact._id} className="w-full bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center gap-1">
                  <button
                    onClick={() => setSelectedContactId(contact._id)}
                    className="flex-1 text-left p-2.5 flex items-center gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{contact.fullName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteContact(e, contact._id)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors flex-shrink-0 mr-1"
                    title="Kişiyi Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
