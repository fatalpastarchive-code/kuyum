"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { use, useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Loader2, Plus, Receipt, X, Phone, Download, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TransactionDetailModal } from "@/components/contacts/TransactionDetailModal";
import { getStatusLabel } from "@/lib/units";
import { useUnits } from "@/components/providers/UnitsProvider";
import * as XLSX from "xlsx";

/** Normalize a Turkish phone number into a tel: compatible format */
function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-().]/g, "");
  // If starts with 0 (Turkish local), replace with +90
  if (normalized.startsWith("0")) {
    normalized = "+90" + normalized.slice(1);
  }
  // If already starts with +, keep as is
  return normalized;
}

export default function ContactProfile({ params }: { params: Promise<{ id: Id<"contacts"> }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;
  
  const { units: UNITS, getUnitLabel } = useUnits();
  
  const contact = useQuery(api.contacts.getContactById, { id: contactId });
  const transactions = useQuery(api.transactions.getTransactionsByContact, { contactId });
  const contactPayments = useQuery(api.transactions.getPaymentsByContact, { contactId });
  
  const addTransaction = useMutation(api.transactions.addTransaction);
  const addPayment = useMutation(api.transactions.addPayment);
  const deleteContact = useMutation(api.contacts.deleteContact);
  const cancelTransaction = useMutation(api.transactions.cancelTransaction);

  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Phase 4 Details Modal
  const [selectedDetailTx, setSelectedDetailTx] = useState<any>(null);

  // Form states for Add Record
  const [recordType, setRecordType] = useState<"verecek" | "alacak">("verecek");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordUnit, setRecordUnit] = useState("TRY");
  const [recordDate, setRecordDate] = useState("");
  const [recordNote, setRecordNote] = useState("");

  // Form states for Add Payment
  const [selectedTxId, setSelectedTxId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      await deleteContact({ id: contactId });
      toast.success("Kişi ve tüm işlem geçmişi başarıyla silindi");
      router.push("/contacts");
    } catch (err) {
      console.error(err);
      toast.error("Kişi silinirken bir hata oluştu");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExcelExport = () => {
    if (!contact || !transactions) return;

    const data: any[][] = [];
    data.push(["KİŞİ VERESİYE RAPORU"]);
    data.push(["Ad Soyad:", contact.fullName]);
    data.push(["Telefon:", contact.phone]);
    data.push(["Not:", contact.note || "-"]);
    data.push([]);
    
    data.push(["NET BAKİYE ÖZETİ"]);
    const activeTxs = transactions.filter(t => t.status !== "odendi" && t.status !== "iptal_edildi");
    const activeBalances = activeTxs.reduce((acc, t) => {
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

    const activeUnits = Object.keys(activeBalances);
    if (activeUnits.length === 0) {
      data.push(["Aktif bakiye bulunmuyor."]);
    } else {
      activeUnits.forEach(unit => {
        const net = activeBalances[unit].verecek - activeBalances[unit].alacak;
        if (net !== 0) {
          const isVerecek = net > 0;
          const relation = isVerecek ? "Bize Borçlu" : "Biz Borçluyuz";
          data.push([`Net: ${Math.abs(net).toLocaleString()} ${getUnitLabel(unit)} (${relation})`]);
        }
      });
    }
    data.push([]);
    data.push([]);
    
    data.push(["İŞLEM VE ÖDEME GEÇMİŞİ"]);
    data.push(["Tarih", "Tür", "Tutar", "Birim", "Vade Tarihi", "Durum", "Not"]);
    
    const paymentsByTx: Record<string, any[]> = {};
    if (contactPayments) {
      contactPayments.forEach(p => {
        if (!paymentsByTx[p.transactionId]) {
          paymentsByTx[p.transactionId] = [];
        }
        paymentsByTx[p.transactionId].push(p);
      });
    }

    transactions.forEach(t => {
      const isVerecek = t.type === "verecek";
      const typeStr = isVerecek ? "Bize Borçlu" : "Biz Borçluyuz";
      const dateStr = new Date(t.createdAt).toLocaleDateString("tr-TR");
      const dueDateStr = new Date(t.dueDate).toLocaleDateString("tr-TR");
      const statusStr = getStatusLabel(t.status);
      
      data.push([
        dateStr,
        typeStr,
        t.amount,
        getUnitLabel(t.unit),
        dueDateStr,
        statusStr,
        t.note || ""
      ]);
      
      const txPayments = paymentsByTx[t._id] || [];
      if (txPayments.length > 0) {
        data.push(["", "↳ Ödeme Tarihi", "Ödenen Tutar", "Not"]);
        txPayments.forEach(p => {
          const pDateStr = new Date(p.paidAt).toLocaleDateString("tr-TR");
          data.push(["", pDateStr, p.amount, p.note || ""]);
        });
        data.push([]); // blank line after payments list
      }
    });

    const replaceTr = (str: any) => {
      if (typeof str !== "string") return str;
      return str
        .replace(/Ğ/g, "G").replace(/ğ/g, "g")
        .replace(/Ü/g, "U").replace(/ü/g, "u")
        .replace(/Ş/g, "S").replace(/ş/g, "s")
        .replace(/İ/g, "I").replace(/ı/g, "i")
        .replace(/Ö/g, "O").replace(/ö/g, "o")
        .replace(/Ç/g, "C").replace(/ç/g, "c");
    };

    const sanitizedData = data.map(row => row.map(cell => replaceTr(cell)));

    const ws = XLSX.utils.aoa_to_sheet(sanitizedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ozet");
    
    const cleanName = replaceTr(contact.fullName).replace(/[^a-zA-Z0-9_]/g, "_");
    
    XLSX.writeFile(wb, `${cleanName}_veresiye_ozet.xlsx`);
    toast.success("Excel dosyası indirildi");
  };

  if (contact === undefined || transactions === undefined) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (contact === null) {
    return (
      <div className="p-8 text-center text-slate-500">
        Kişi bulunamadı.
        <Link href="/contacts" className="block mt-4 text-blue-500">Geri dön</Link>
      </div>
    );
  }

  const activeTransactions = transactions.filter(t => t.status !== "odendi" && t.status !== "iptal_edildi");
  const archivedTransactions = transactions.filter(t => t.status === "odendi" || t.status === "iptal_edildi");

  // Calculate net balances based on active transactions
  const balances = activeTransactions.reduce((acc, t) => {
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

  const units = Object.keys(balances);
  const displayedTransactions = activeTab === "active" ? activeTransactions : archivedTransactions;

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordAmount || !recordDate) return;
    
    const amountNum = parseFloat(recordAmount);
    if (amountNum <= 0) {
      toast.error("Tutar 0'dan büyük olmalı");
      return;
    }
    
    const dueDate = new Date(recordDate).getTime();
    if (dueDate < Date.now()) {
      const confirmPast = window.confirm("Girdiğiniz tarih geçmişte. Yine de eklemek istiyor musunuz?");
      if (!confirmPast) return;
    }

    setLoading(true);
    try {
      await addTransaction({
        contactId,
        type: recordType,
        amount: amountNum,
        unit: recordUnit,
        dueDate,
        note: recordNote || undefined,
      });
      toast.success("Kayıt başarıyla eklendi");
      setShowAddRecord(false);
      setRecordAmount("");
      setRecordDate("");
      setRecordNote("");
    } catch (err) {
      console.error(err);
      toast.error("Kayıt eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !paymentAmount) return;

    const amountNum = parseFloat(paymentAmount);
    if (amountNum <= 0) {
      toast.error("Tutar 0'dan büyük olmalı");
      return;
    }

    const selectedTx = activeTransactions.find(t => t._id === selectedTxId);
    if (selectedTx && amountNum > selectedTx.amount) {
      toast.error("Ödenen tutar kalan tutardan (" + selectedTx.amount + ") büyük olamaz");
      return;
    }

    setLoading(true);
    try {
      await addPayment({
        transactionId: selectedTxId as Id<"transactions">,
        amount: amountNum,
        note: paymentNote || undefined,
      });
      toast.success("Ödeme başarıyla kaydedildi");
      setShowAddPayment(false);
      setPaymentAmount("");
      setSelectedTxId("");
      setPaymentNote("");
    } catch (err) {
      console.error(err);
      toast.error("Ödeme kaydedilemedi, lütfen tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = async (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    
    setLoading(true);
    try {
      await cancelTransaction({ transactionId: txId as Id<"transactions"> });
      toast.success("Kayıt silindi (İptal edildi)");
    } catch (err) {
      console.error(err);
      toast.error("Kayıt silinirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const telHref = `tel:${normalizePhone(contact.phone)}`;

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32">
      <header className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{contact.fullName}</h1>
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
              <button
                onClick={handleExcelExport}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                title="Excel İndir"
              >
                <Download className="w-3 h-3" />
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Daha fazla seçenek"
          >
            <MoreVertical className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Kişiyi Sil
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Net Bakiye Özeti */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <h2 className="font-semibold border-b border-slate-100 dark:border-slate-800 pb-2">Net Bakiye</h2>
        {units.length === 0 ? (
          <div className="text-slate-500 text-sm">Aktif bakiye bulunmuyor.</div>
        ) : (
          <div className="space-y-3">
            {units.map((unit) => {
              const net = balances[unit].verecek - balances[unit].alacak;
              const isVerecek = net > 0;
              if (net === 0) return null;
              
              return (
                <div key={unit} className="flex justify-between items-center">
                  <span className="font-medium text-slate-600 dark:text-slate-400">{getUnitLabel(unit)}</span>
                  <span className={`font-bold flex items-center text-lg ${isVerecek ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {isVerecek ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                    {isVerecek ? "Bize Borçlu" : "Biz Borçluyuz"}: {Math.abs(net).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Aksiyon Butonları */}
      <div className="flex gap-3">
        <button 
          onClick={() => setShowAddRecord(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Kayıt Ekle
        </button>
        <button 
          onClick={() => setShowAddPayment(true)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Receipt className="w-5 h-5" /> Ödeme Gir
        </button>
      </div>

      {/* İşlem Geçmişi */}
      <section>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${activeTab === "active" ? "bg-white dark:bg-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Aktif
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${activeTab === "archive" ? "bg-white dark:bg-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Arşiv
          </button>
        </div>

        <div className="space-y-3">
          {displayedTransactions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Bu listede işlem bulunmuyor.
            </div>
          ) : (
            displayedTransactions.map((t) => {
              const isVerecek = t.type === "verecek";
              return (
                <div 
                  key={t._id} 
                  onClick={() => setSelectedDetailTx(t)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span className={isVerecek ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
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
                  <div className="flex items-center gap-3">
                    <div className={`font-bold flex items-center ${isVerecek ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {isVerecek ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                      {t.amount.toLocaleString()} {getUnitLabel(t.unit)}
                    </div>
                    {activeTab === "active" && (
                      <button 
                        onClick={(e) => handleCancelTransaction(e, t._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Kayıt Ekle Modal */}
      {showAddRecord && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-w-md w-full mx-auto animate-in slide-in-from-bottom-full duration-300 max-h-[90dvh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold">Yeni Kayıt Ekle</h2>
              <button onClick={() => setShowAddRecord(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordType("verecek")}
                    className={`p-3 rounded-xl border font-medium ${recordType === "verecek" ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                  >
                    <ArrowUpRight className="w-5 h-5 inline-block mr-1" />
                    Bize Borçlu
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType("alacak")}
                    className={`p-3 rounded-xl border font-medium ${recordType === "alacak" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                  >
                    <ArrowDownRight className="w-5 h-5 inline-block mr-1" />
                    Biz Borçluyuz
                  </button>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Tutar</label>
                    <input type="number" step="0.01" required value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" placeholder="0.00" />
                  </div>
                  <div className="w-2/5 space-y-1">
                    <label className="text-sm font-medium">Birim</label>
                    <select value={recordUnit} onChange={(e) => setRecordUnit(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {UNITS.map((u) => (
                        <option key={u.code} value={u.code}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Vade Tarihi</label>
                  <input type="datetime-local" required value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Not (Opsiyonel)</label>
                  <input type="text" value={recordNote} onChange={(e) => setRecordNote(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" placeholder="Açıklama..." />
                </div>
              </div>

              <div className="flex-shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800 pb-safe">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödeme Gir Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-w-md w-full mx-auto animate-in slide-in-from-bottom-full duration-300 max-h-[90dvh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold">Ödeme Gir</h2>
              <button onClick={() => setShowAddPayment(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {activeTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 flex-1 overflow-y-auto">
                Aktif borç/alacak kaydı bulunmuyor.
              </div>
            ) : (
              <form onSubmit={handleAddPayment} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Hangi Kayıt İçin?</label>
                    <select required value={selectedTxId} onChange={(e) => setSelectedTxId(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <option value="" disabled>Seçiniz...</option>
                      {activeTransactions.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.type === "verecek" ? "Bize Borçlu" : "Biz Borçluyuz"}: {t.amount} {getUnitLabel(t.unit)} ({new Date(t.dueDate).toLocaleDateString("tr-TR")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Ödenen Tutar</label>
                    <input type="number" step="0.01" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" placeholder="0.00" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Not (Opsiyonel)</label>
                    <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" placeholder="Açıklama..." />
                  </div>
                </div>

                <div className="flex-shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800 pb-safe">
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />} Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedDetailTx && (
        <TransactionDetailModal 
          transaction={selectedDetailTx} 
          onClose={() => setSelectedDetailTx(null)} 
        />
      )}

      {/* Kişi Silme Onay Modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex flex-col justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-auto animate-in zoom-in-95 duration-200 shadow-xl">
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Kişiyi Sil</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed text-sm">
              <strong className="text-slate-900 dark:text-white">{contact.fullName}</strong> ve bu kişiye ait tüm işlem geçmişi kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?
            </p>

            {Object.keys(balances).some(unit => {
              const net = balances[unit].verecek - balances[unit].alacak;
              return net !== 0;
            }) && (
              <div className="my-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  ⚠️ Bu kişinin hâlâ kapanmamış borç/alacak kaydı var:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  {Object.keys(balances).map(unit => {
                    const net = balances[unit].verecek - balances[unit].alacak;
                    if (net === 0) return null;
                    const isVerecek = net > 0;
                    return (
                      <li key={unit}>
                        {isVerecek ? "Bize Borçlu" : "Biz Borçluyuz"}: {Math.abs(net).toLocaleString()} {getUnitLabel(unit)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteContact}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
