"use client";
import { useLanguage } from "@/components/i18n-provider";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="error-page">
      <p className="eyebrow">{t("SUELOVIVO PUTUMAYO")}</p>
      <h1>{t("No pudimos abrir el explorador.")}</h1>
      <p>{t("Intenta de nuevo. Tus datos guardados en este navegador siguen disponibles.")}</p>
      <button className="primary-button" onClick={reset}>
        {t("Volver a intentar")}{" "}
      </button>
    </main>
  );
}
