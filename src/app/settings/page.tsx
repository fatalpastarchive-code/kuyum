"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut, Save, Moon, Sun, Monitor, Bell, User, Lock, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const settings = useQuery(api.settings.getSettings);
  const notificationSettings = useQuery(api.settings.getNotificationSettings);
  
  const updateDisplayName = useMutation(api.settings.updateDisplayName);
  const updatePin = useMutation(api.settings.updatePin);
  const updateNotificationSettings = useMutation(api.settings.updateNotificationSettings);
  
  const { theme, setTheme } = useTheme();

  // Local state for forms
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [reminderDays, setReminderDays] = useState("1");
  const [overdueInterval, setOverdueInterval] = useState("1");

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName);
      setPin(settings.pin);
    }
  }, [settings]);

  useEffect(() => {
    if (notificationSettings) {
      setReminderDays(notificationSettings.reminderDaysBefore.toString());
      setOverdueInterval(notificationSettings.overdueRepeatIntervalDays.toString());
    }
  }, [notificationSettings]);

  const handleSaveDisplayName = async () => {
    try {
      await updateDisplayName({ displayName });
      toast.success("İsim güncellendi.");
    } catch (e) {
      toast.error("Hata oluştu.");
    }
  };

  const handleSavePin = async () => {
    if (pin.length !== 4) {
      toast.error("Şifre 4 haneli olmalıdır.");
      return;
    }
    try {
      await updatePin({ pin });
      toast.success("Şifre güncellendi.");
    } catch (e) {
      toast.error("Hata oluştu.");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotificationSettings({
        reminderDaysBefore: parseInt(reminderDays),
        overdueRepeatIntervalDays: parseInt(overdueInterval),
      });
      toast.success("Bildirim ayarları güncellendi.");
    } catch (e) {
      toast.error("Hata oluştu.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("unlockedDate");
    router.replace("/welcome");
  };

  if (!settings || !notificationSettings) return <div className="p-4 text-center text-slate-500 animate-pulse">Yükleniyor...</div>;

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto mb-20">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Ayarlar</h1>

      {/* Profil Section */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <User className="w-5 h-5 text-blue-500" /> Görünen Ad
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button onClick={handleSaveDisplayName} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            <Save className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* PIN Section */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Lock className="w-5 h-5 text-orange-500" /> Şifre (PIN) Değiştir
        </h2>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono tracking-widest text-center"
          />
          <button onClick={handleSavePin} className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
            <Save className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Bell className="w-5 h-5 text-purple-500" /> Bildirim Ayarları
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-600 dark:text-slate-400">Vade öncesi hatırlatma (Gün)</label>
            <input
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="w-20 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-600 dark:text-slate-400">Gecikme tekrarı (Gün)</label>
            <input
              type="number"
              value={overdueInterval}
              onChange={(e) => setOverdueInterval(e.target.value)}
              className="w-20 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
            />
          </div>
          <button onClick={handleSaveNotifications} className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Save className="w-4 h-4" /> Kaydet
          </button>
        </div>
      </section>

      {/* Theme Section */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Moon className="w-5 h-5 text-indigo-500" /> Tema
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${theme === "light" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Sun className="w-4 h-4" /> Açık
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${theme === "dark" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Moon className="w-4 h-4" /> Koyu
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${theme === "system" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            <Monitor className="w-4 h-4" /> Sistem
          </button>
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium border border-red-100 dark:border-red-900/30"
      >
        <LogOut className="w-5 h-5" />
        Kilitle / Çıkış Yap
      </button>
    </div>
  );
}
