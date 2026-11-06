"use client";

import { useRef, useState } from "react";
import { PropertyContactButton, recordPropertyContactClick } from "@/components/analytics/PropertyContactButton";
import { brazilianPhone, propertyContactUrl, propertyWhatsappTarget } from "@/lib/property-contact";
import { INQUIRY_CONSENT } from "@/lib/property-inquiry";
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_TITLE } from "@/lib/privacy-policy";

export function PropertyContactForm({ imovelId, whatsappHref, context, slug, foco }: {
  imovelId: string; whatsappHref: string | null; context: string; slug: string; foco?: "locacao" | "venda" | null;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [continuation, setContinuation] = useState<string | null>(null);
  const submitting = useRef(false);
  const target = propertyWhatsappTarget(whatsappHref);
  if (!target || !whatsappHref) return <PropertyContactButton imovelId={imovelId} />;
  const inputClass = "w-full border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra-light";

  return <form className="flex flex-col gap-3.5" aria-busy={pending} onSubmit={async event => {
    event.preventDefault();
    if (submitting.current) return;
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
    if (data.get("consent") !== "on") { setError("Autorize o cadastro e contato para continuar."); return; }
    setError("");
    setSuccess("");
    submitting.current = true;
    setPending(true);
    setContinuation(href);
    // Open synchronously from the user gesture; waiting for RD can trigger popup blockers.
    recordPropertyContactClick(imovelId, true);
    window.open(href, "_blank", "noopener,noreferrer");
    try {
      const response = await fetch("/api/imoveis/contato", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, email: data.get("email"), consent: true, slug, foco }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 200 && body?.ok === true) setSuccess("Cadastro realizado. Conclua a conversa no WhatsApp.");
      else setError(typeof body?.message === "string" ? body.message : "Não foi possível confirmar o cadastro. Você pode continuar pelo WhatsApp.");
    } catch {
      setError("Não foi possível confirmar o cadastro. Você pode continuar pelo WhatsApp.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }}>
    <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3.5 border-0 p-0">
    <legend className="sr-only">Contato sobre o imóvel</legend>
    <label className="block"><span className="sr-only">Seu nome</span>
      <input className={inputClass} name="name" placeholder="Seu nome" autoComplete="name" required minLength={2} maxLength={120} />
    </label>
    <label className="block"><span className="sr-only">WhatsApp com DDD</span>
      <input className={inputClass} name="phone" type="tel" placeholder="WhatsApp com DDD" autoComplete="tel" required maxLength={30} onChange={() => setError("")} />
    </label>
    <label className="block"><span className="sr-only">Mensagem</span>
      <textarea className={`${inputClass} resize-none`} name="message" defaultValue={target.searchParams.get("text") ?? ""} required maxLength={2000} rows={3} />
    </label>
    <label className="block"><span className="sr-only">E-mail</span>
      <input className={inputClass} name="email" type="email" placeholder="E-mail" autoComplete="email" required maxLength={254} />
    </label>
    <label className="flex items-start gap-2 text-detail leading-relaxed text-white/75">
      <input className="mt-1 shrink-0 accent-terra" name="consent" type="checkbox" required />
      <span>{INQUIRY_CONSENT.slice(0, -(`${PRIVACY_POLICY_TITLE}.`.length))}<a className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra-light" href={PRIVACY_POLICY_PATH} target="_blank" rel="noopener noreferrer">{PRIVACY_POLICY_TITLE}</a>.</span>
    </label>
    <button className="mt-1 min-h-11 bg-terra p-3.5 text-caption uppercase tracking-[0.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra-light" type="submit">{pending ? "Enviando" : "Continuar no WhatsApp"}</button>
    </fieldset>
    {error && <p role="alert" className="text-detail text-white">{error}</p>}
    {success && <p role="status" className="text-detail text-white">{success}</p>}
    {continuation && <a className="text-detail text-white underline underline-offset-4" href={continuation} target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp</a>}
  </form>;
}
