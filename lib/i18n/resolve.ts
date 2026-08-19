import { RunError } from "../errors/codes";
import { Locale, DEFAULT_LOCALE } from "./locale";
import { UiKey } from "./ui-keys";
import enCatalog from "../../messages/en.json";
import siCatalog from "../../messages/si.json";

type CatalogErrorEntry = { message: string; hint: string };
type LocaleCatalog = {
  errors: Record<string, CatalogErrorEntry>;
  ui: Record<string, string>;
};

const catalogs: Record<Locale, LocaleCatalog> = {
  en: enCatalog as LocaleCatalog,
  si: siCatalog as LocaleCatalog,
};

export function resolveMessage(
  err: RunError,
  locale: Locale = DEFAULT_LOCALE
): { message: string; hint: string } {
  const cat = catalogs[locale] ?? catalogs.en;
  const entry = cat.errors[err.code] ?? catalogs.en.errors[err.code] ?? {
    message: `Error: ${err.code}`,
    hint: "Please check your flowchart for issues.",
  };

  let message = entry.message;
  let hint = entry.hint;

  const params = err.params as Record<string, unknown>;

  for (const [key, value] of Object.entries(params)) {
    let formatted = "";
    if (Array.isArray(value)) {
      formatted = value.join(", ");
    } else if (value !== undefined && value !== null) {
      formatted = String(value);
    }

    const placeholder = `{${key}}`;
    message = message.replaceAll(placeholder, formatted);
    hint = hint.replaceAll(placeholder, formatted);
  }

  // Clean up any remaining unpopulated optional placeholders
  message = message.replaceAll(/\{[A-Za-z0-9_]+\}/g, "");
  hint = hint.replaceAll(/\{[A-Za-z0-9_]+\}/g, "");

  return { message, hint };
}

export function t(
  key: UiKey,
  locale: Locale = DEFAULT_LOCALE,
  params?: Record<string, string | number>
): string {
  const cat = catalogs[locale] ?? catalogs.en;
  let text = cat.ui[key] ?? catalogs.en.ui[key] ?? key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replaceAll(`{${paramKey}}`, String(value));
    }
  }

  return text;
}
