"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, Banknote, Archive } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { href: "/", label: "Özet", icon: Home },
  { href: "/contacts", label: "Kişiler", icon: Users },
  { href: "/collections", label: "Tahsilatlar", icon: Banknote },
  { href: "/archive", label: "Arşiv", icon: Archive },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 z-10 relative" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium z-10 relative leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
