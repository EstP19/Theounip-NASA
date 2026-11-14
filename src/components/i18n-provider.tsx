"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { formatLocale, LANGUAGE_COOKIE, translator, type Locale } from "@/lib/i18n";

type Language = {
  locale: Locale;
  formatting: string;
  t: ReturnType<typeof translator>;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<Language>({
  locale: "es",
  formatting: "es-CO",
  t: translator("es"),
  setLocale: () => {},
});

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLanguage] = useState(initialLocale);
  const value = useMemo(
    () => ({
      locale,
      formatting: formatLocale(locale),
      t: translator(locale),
      setLocale(next: Locale) {
        document.documentElement.lang = next;
        document.cookie = `${LANGUAGE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
        document.title = translator(next)("SueloVivo · Cacao, territorio y datos");
        document
          .querySelector('meta[name="description"]')
          ?.setAttribute(
            "content",
            translator(next)(
              "Explora el manejo agroforestal del cacao en Putumayo con datos ambientales NASA y evidencia territorial.",
            ),
          );
        setLanguage(next);
      },
    }),
    [locale],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
