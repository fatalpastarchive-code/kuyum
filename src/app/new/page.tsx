"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Phone, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewContact() {
  const router = useRouter();
  const createContact = useMutation(api.contacts.createContact);
  const contacts = useQuery(api.contacts.getContacts, {});
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    if (contacts && !duplicateWarning) {
      const normalizedInputName = fullName.trim().toLowerCase();
      const normalizedInputPhone = phone.replace(/\D/g, "");
      
      const duplicate = contacts.find(c => {
        const cName = c.fullName.trim().toLowerCase();
        const cPhone = c.phone.replace(/\D/g, "");
        return cName === normalizedInputName && cPhone === normalizedInputPhone;
      });

      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }
    
    createAndProceed();
  };

  const createAndProceed = async () => {
    setLoading(true);
    try {
      const newContactId = await createContact({ fullName, phone, note });
      toast.success("Kişi başarıyla eklendi");
      router.push(`/contacts/${newContactId}`);
    } catch (error) {
      console.error(error);
      toast.error("Kişi oluşturulurken hata oluştu");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32">
      <header className="flex items-center gap-4 pt-2">
        <button type="button" onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Yeni Kişi Ekle</h1>
          <p className="text-sm text-slate-500">Müşteri kaydı oluşturun</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ad Soyad</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setDuplicateWarning(null); }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Ahmet Yılmaz"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              required
              maxLength={11}
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setDuplicateWarning(null); }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: 0555 123 45 67"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Not (Opsiyonel)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kişi hakkında ek bilgi..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Kaydet ve Devam Et
        </button>
      </form>

      {/* Mükerrer Kişi Uyarı Modalı */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-auto animate-in zoom-in-95 duration-200 shadow-xl">
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Mükerrer Kayıt Uyarısı</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Bu isim ve numarayla zaten bir kayıt var: <strong className="text-slate-900 dark:text-white">{duplicateWarning.fullName}</strong>. Yine de yeni bir kişi oluşturmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/contacts/${duplicateWarning._id}`)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-xl font-medium transition-colors"
              >
                Mevcut Kişiye Git
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  createAndProceed();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-medium transition-colors"
              >
                Yine de Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
