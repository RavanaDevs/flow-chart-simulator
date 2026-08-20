"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useT();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeTheme = mounted ? (resolvedTheme || theme) : "light";

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-all",
          activeTheme === "light"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title={t("toolbar.themeLight")}
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>{t("toolbar.themeLight")}</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-all",
          activeTheme === "dark"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title={t("toolbar.themeDark")}
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>{t("toolbar.themeDark")}</span>
      </button>
    </div>
  );
};
