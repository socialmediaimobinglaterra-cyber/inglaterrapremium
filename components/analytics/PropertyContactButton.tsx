"use client";

import { contactSettings } from "@/lib/contact-settings";

type Props = {
  imovelId: string;
  whatsappHref?: string | null;
};

export function recordPropertyContactClick(imovelId: string, isWhatsapp: boolean) {
  const body = JSON.stringify({
    tipoEvento: isWhatsapp ? "clique_whatsapp" : "clique_contato",
    imovelId,
    canal: isWhatsapp ? "whatsapp" : "formulario_ficha",
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/event", blob)) return;
    }

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch { /* Analytics must never prevent contact navigation. */ }
}

export function PropertyContactButton({ imovelId, whatsappHref }: Props) {
  const className =
    "mt-1 bg-terra p-3.5 text-[10px] uppercase tracking-[0.2em] text-white";

  if (whatsappHref) {
    return (
      <a
        className={`${className} text-center`}
        href={whatsappHref}
        onClick={() => recordPropertyContactClick(imovelId, true)}
        rel="noreferrer"
        target="_blank"
      >
        Falar com a corretora
      </a>
    );
  }

  return (
    <a
      className={`${className} block text-center`}
      onClick={() => recordPropertyContactClick(imovelId, true)}
      href={contactSettings.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
    >
      Falar com a equipe
    </a>
  );
}
