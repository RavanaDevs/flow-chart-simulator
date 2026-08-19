"use client";

import React, { useEffect, useState } from "react";
import { useUiStore, LOCALE_STORAGE_KEY } from "@/stores/ui-store";
import { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export const LocaleToggle: React.FC = () => {
  const { locale, setLocale } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (saved === "en" || saved === "si") {
          setLocale(saved);
        }
      } catch {
        // Storage access fallback
      }
    }
  }, [setLocale]);

  const activeLocale = mounted ? locale : "en";

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5 text-xs">
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn(
          "rounded px-2 py-0.5 text-[11px] font-semibold transition-all",
          activeLocale === "en"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLocale("si")}
        className={cn(
          "rounded px-2 py-0.5 text-[11px] font-semibold transition-all",
          activeLocale === "si"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        සිංහල
      </button>
    </div>
  );
};
