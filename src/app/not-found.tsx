"use client";
import Link from "next/link";
import { useLanguage } from "@/components/i18n-provider";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="error-page">
      <p className="eyebrow">SueloVivo Putumayo</p>
      <h1>{t("Paso no encontrado")}</h1>
      <p>{t("No encontramos este paso del plan.")}</p>
      <Link className="primary-button" href="/ubicacion">
        {t("Volver a la ubicación")}
      </Link>
    </main>
  );
}
