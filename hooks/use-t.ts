"use client";

import { useUiStore } from "@/stores/ui-store";
import { t, resolveMessage } from "@/lib/i18n/resolve";
import { UiKey } from "@/lib/i18n/ui-keys";
import { RunError } from "@/lib/errors/codes";

export function useT() {
  const locale = useUiStore((s) => s.locale);

  return {
    locale,
    t: (key: UiKey, params?: Record<string, string | number>) =>
      t(key, locale, params),
    resolveMessage: (err: RunError) => resolveMessage(err, locale),
  };
}
