import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/i18n-provider";
import { LANGUAGE_COOKIE, parseLocale, translator } from "@/lib/i18n";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const dmSans = localFont({
  src: "../assets/dm-sans-latin.woff2",
  variable: "--font-body",
  weight: "400 700",
  display: "swap",
});
const manrope = localFont({
  src: "../assets/manrope-latin.woff2",
  variable: "--font-heading",
  weight: "400 800",
  display: "swap",
});

async function requestLocale() {
  return parseLocale((await cookies()).get(LANGUAGE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = translator(await requestLocale());
  return {
    title: t("SueloVivo · Cacao, territorio y datos"),
    description: t(
      "Explora el manejo agroforestal del cacao en Putumayo con datos ambientales NASA y evidencia territorial.",
    ),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await requestLocale();
  return (
    <html lang={locale} className={`${dmSans.variable} ${manrope.variable}`}>
      <body>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
