import { create } from "zustand";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n/locale";

export const LOCALE_STORAGE_KEY = "flowchart-sim:locale";

type UiState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useUiStore = create<UiState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale: Locale) => {
    set({ locale });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Ignore storage errors in private mode or restricted contexts
      }
    }
  },
}));
