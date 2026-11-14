import en from "./messages-en.json" with { type: "json" };

export type Locale = "es" | "en";
export const LANGUAGE_COOKIE = "suelovivo-language";

export function parseLocale(value: unknown): Locale {
  return value === "en" ? "en" : "es";
}

export function formatLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es-CO";
}

type MessageValue = string | number | null | undefined;
const english: Readonly<Record<string, string>> = en;

export function translator(locale: Locale) {
  return (message: string, ...values: MessageValue[]) => {
    const text = locale === "en" && Object.hasOwn(english, message) ? english[message] : message;
    return text.replace(/\{(\d+)\}/g, (token, index: string) => {
      const value = values[Number(index)];
      return value === undefined ? token : value === null ? "" : String(value);
    });
  };
}

export function monthLabel(month: number, locale: Locale) {
  return new Intl.DateTimeFormat(formatLocale(locale), { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(2000, month - 1, 1)))
    .replace(/\.$/, "");
}
