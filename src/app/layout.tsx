import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "SueloVivo · Cacao, territorio y datos",
  description:
    "Explora el manejo agroforestal del cacao en Putumayo con datos ambientales NASA y evidencia territorial.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
