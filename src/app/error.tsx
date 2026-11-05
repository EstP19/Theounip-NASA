"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <p className="eyebrow">SUELOVIVO PUTUMAYO</p>
      <h1>No pudimos abrir el explorador.</h1>
      <p>Intenta de nuevo. Tus datos guardados en este navegador siguen disponibles.</p>
      <button className="primary-button" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
