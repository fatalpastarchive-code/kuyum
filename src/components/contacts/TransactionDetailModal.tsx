"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Loader2, ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useUnits } from "@/components/providers/UnitsProvider";
import { getStatusLabel } from "@/lib/units";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  transaction: any; // Ideally import the correct type
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
}: Props) {
  const { getUnitLabel } = useUnits();
  const payments = useQuery(api.transactions.getPaymentsByTransaction, {
    transactionId: transaction._id,
  });
  const addPayment = useMutation(api.transactions.addPayment);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isVerecek = transaction.type === "verecek";
  const typeLabel = isVerecek ? "Bize Borçlu" : "Biz Borçluyuz";
  const TypeIcon = isVerecek ? ArrowUpRight : ArrowDownRight;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;

    const amountNum = parseFloat(paymentAmount);
    if (amountNum <= 0) {
      toast.error("Tutar 0'dan büyük olmalı");
      return;
    }

    if (amountNum > transaction.amount) {
      toast.error(`Ödenen tutar kalan tutardan (${transaction.amount}) büyük olamaz`);
      return;
    }

    setLoading(true);
    try {
      await addPayment({
        transactionId: transaction._id,
        amount: amountNum,
        note: paymentNote || undefined,
      });
      toast.success("Ödeme başarıyla eklendi");
      setShowAddPayment(false);
      setPaymentAmount("");
      setPaymentNote("");
    } catch (err) {
      console.error(err);
      toast.error("Ödeme eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex flex-col justify-end">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-w-md w-full mx-auto animate-in slide-in-from-bottom-full duration-300 max-h-[90dvh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold">İşlem Detayı</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-safe">
          {/* Main Info */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                isVerecek ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {typeLabel}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                {getStatusLabel(transaction.status)}
              </span>
            </div>
            
            <div className="text-3xl font-bold mb-1 flex items-center">
              <TypeIcon className={`w-6 h-6 mr-1 ${isVerecek ? "text-green-500" : "text-red-500"}`} />
              {transaction.amount.toLocaleString()} {getUnitLabel(transaction.unit)}
            </div>
            <div className="text-sm text-slate-500 mb-4">Kalan Bakiye</div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 dark:border-slate-800 pt-4">
              <div>
                <div className="text-slate-500 mb-1">Kayıt Tarihi</div>
                <div className="font-medium">{new Date(transaction.createdAt).toLocaleDateString("tr-TR")}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Vade Tarihi</div>
                <div className="font-medium">{new Date(transaction.dueDate).toLocaleDateString("tr-TR")}</div>
              </div>
            </div>

            {transaction.note && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm">
                <div className="text-slate-500 mb-1">Not</div>
                <div className="text-slate-700 dark:text-slate-300">{transaction.note}</div>
              </div>
            )}
          </div>

          {/* Add Payment Button (If active) */}
          {transaction.status !== "odendi" && !showAddPayment && (
            <button 
              onClick={() => setShowAddPayment(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Receipt className="w-5 h-5" /> Bu İşleme Ödeme Gir
            </button>
          )}

          {/* Add Payment Form */}
          {showAddPayment && (
            <form onSubmit={handleAddPayment} className="space-y-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Ödeme Gir</h3>
                <button type="button" onClick={() => setShowAddPayment(false)} className="text-blue-500 hover:text-blue-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <label className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1 block">Tutar</label>
                <input type="number" step="0.01" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800" placeholder="0.00" />
              </div>

              <div>
                <label className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1 block">Not (Opsiyonel)</label>
                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800" placeholder="Açıklama..." />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 mt-2 transition-colors">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
              </button>
            </form>
          )}

          {/* Payments History */}
          <div>
            <h3 className="font-bold mb-3">Ödeme Geçmişi</h3>
            {payments === undefined ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : payments.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                Bu işleme ait henüz bir ödeme yok.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map(payment => (
                  <div key={payment._id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-medium text-sm">{new Date(payment.paidAt).toLocaleDateString("tr-TR")}</div>
                      {payment.note && <div className="text-xs text-slate-500">{payment.note}</div>}
                    </div>
                    <div className="font-bold text-sm">
                      {payment.amount.toLocaleString()} {getUnitLabel(transaction.unit)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
