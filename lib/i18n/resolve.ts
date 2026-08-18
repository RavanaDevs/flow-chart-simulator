import { RunError } from "../errors/codes";
import { Locale, DEFAULT_LOCALE } from "./locale";
import enCatalog from "../../messages/en.json";

type CatalogEntry = { message: string; hint: string };
type CatalogMap = Record<string, CatalogEntry>;

const catalogs: Record<Locale, CatalogMap> = {
  en: enCatalog as CatalogMap,
  si: enCatalog as CatalogMap, // fallback to en until si.json is added
};

export function resolveMessage(
  err: RunError,
  locale: Locale = DEFAULT_LOCALE
): { message: string; hint: string } {
  const cat = catalogs[locale] ?? catalogs.en;
  const entry = cat[err.code] ?? {
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

  // Clean up any remaining unpopulated optional placeholders like {suggestion}
  message = message.replaceAll(/\{[A-Za-z0-9_]+\}/g, "");
  hint = hint.replaceAll(/\{[A-Za-z0-9_]+\}/g, "");

  return { message, hint };
}
