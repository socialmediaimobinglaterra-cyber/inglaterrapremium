"use client";

import { useState } from "react";
import { PropertyContactButton, recordPropertyContactClick } from "@/components/analytics/PropertyContactButton";
import { brazilianPhone, propertyContactUrl, propertyWhatsappTarget } from "@/lib/property-contact";

export function PropertyContactForm({ imovelId, whatsappHref, context }: {
  imovelId: string; whatsappHref: string | null; context: string;
}) {
  const [error, setError] = useState("");
  const target = propertyWhatsappTarget(whatsappHref);
  if (!target || !whatsappHref) return <PropertyContactButton imovelId={imovelId} />;
  const inputClass = "w-full border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra-light";

  return <form className="flex flex-col gap-3.5" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = { name: String(data.get("name") ?? ""), phone: String(data.get("phone") ?? ""), message: String(data.get("message") ?? "") };
    if (!brazilianPhone(contact.phone)) {
      setError("Informe um WhatsApp válido com DDD.");
      (form.elements.namedItem("phone") as HTMLInputElement)?.focus();
      return;
    }
    const href = propertyContactUrl(whatsappHref, contact, context);
    if (!href) { setError("Preencha seu nome e sua mensagem."); return; }
    setError("");
    recordPropertyContactClick(imovelId, true);
    window.open(href, "_blank", "noopener,noreferrer");
  }}>
    <label className="block"><span className="sr-only">Seu nome</span>
      <input className={inputClass} name="name" placeholder="Seu nome" autoComplete="name" required minLength={2} maxLength={120} />
    </label>
    <label className="block"><span className="sr-only">WhatsApp com DDD</span>
      <input className={inputClass} name="phone" type="tel" placeholder="WhatsApp com DDD" autoComplete="tel" required maxLength={30} onChange={() => setError("")} />
    </label>
    <label className="block"><span className="sr-only">Mensagem</span>
      <textarea className={`${inputClass} resize-none`} name="message" defaultValue={target.searchParams.get("text") ?? ""} required maxLength={2000} rows={3} />
    </label>
    <button className="mt-1 min-h-11 bg-terra p-3.5 text-[10px] uppercase tracking-[0.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra-light" type="submit">Continuar no WhatsApp</button>
    {error && <p role="alert" className="text-xs text-white">{error}</p>}
  </form>;
}
