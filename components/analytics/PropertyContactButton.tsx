"use client";

type Props = {
  imovelId: string;
  whatsappHref?: string | null;
};

function sendClickEvent(imovelId: string, isWhatsapp: boolean) {
  const body = JSON.stringify({
    tipoEvento: isWhatsapp ? "clique_whatsapp" : "clique_contato",
    imovelId,
    canal: isWhatsapp ? "whatsapp" : "formulario_ficha",
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function PropertyContactButton({ imovelId, whatsappHref }: Props) {
  const className =
    "mt-1 bg-terra p-3.5 text-[10px] uppercase tracking-[0.2em] text-white";

  if (whatsappHref) {
    return (
      <a
        className={`${className} text-center`}
        href={whatsappHref}
        onClick={() => sendClickEvent(imovelId, true)}
        rel="noreferrer"
        target="_blank"
      >
        Falar com a corretora
      </a>
    );
  }

  return (
    <button
      className={className}
      onClick={() => sendClickEvent(imovelId, false)}
      type="button"
    >
      Falar com a corretora
    </button>
  );
}
