"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface UnitDef {
  _id?: string;
  code: string;
  label: string;
  icon: string;
}

const DEFAULT_UNITS: UnitDef[] = [
  { code: "TRY",          label: "Türk Lirası",     icon: "₺" },
  { code: "USD",          label: "Amerikan Doları",  icon: "$" },
  { code: "EUR",          label: "Euro",             icon: "€" },
  { code: "GOLD_GRAM",    label: "Gram Altın",       icon: "🪙" },
  { code: "GOLD_QUARTER", label: "Çeyrek Altın",     icon: "🥇" },
  { code: "GOLD_HALF",    label: "Yarım Altın",      icon: "🥇" },
  { code: "GOLD_FULL",    label: "Tam Altın",        icon: "🥇" },
];

interface UnitsContextType {
  units: UnitDef[];
  getUnitLabel: (code: string) => string;
  getUnitIcon: (code: string) => string;
  isLoading: boolean;
}

const UnitsContext = createContext<UnitsContextType>({
  units: DEFAULT_UNITS,
  getUnitLabel: (code) => DEFAULT_UNITS.find((u) => u.code === code)?.label ?? code,
  getUnitIcon: (code) => DEFAULT_UNITS.find((u) => u.code === code)?.icon ?? "",
  isLoading: true,
});

export function UnitsProvider({ children }: { children: ReactNode }) {
  const dbUnits = useQuery(api.units.getUnits);
  
  const units = dbUnits && dbUnits.length > 0 ? dbUnits : DEFAULT_UNITS;
  const isLoading = dbUnits === undefined;

  const getUnitLabel = (code: string) => {
    return units.find((u) => u.code === code)?.label ?? code;
  };

  const getUnitIcon = (code: string) => {
    return units.find((u) => u.code === code)?.icon ?? "";
  };

  return (
    <UnitsContext.Provider value={{ units, getUnitLabel, getUnitIcon, isLoading }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitsContext);
}
