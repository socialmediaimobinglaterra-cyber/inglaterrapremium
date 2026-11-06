"use client";

import { useRef, useState, type FormEvent } from "react";
import { NEWSLETTER_CONSENT } from "@/lib/newsletter";

export function NewsletterForm() {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "on" }),
      });
      const body = await response.json().catch(() => null);
      const ok = response.status === 200 && body?.ok === true;
      setResult({ ok, message: typeof body?.message === "string" ? body.message : "Não foi possível confirmar o cadastro. Tente novamente mais tarde." });
      if (ok) form.reset();
    } catch {
      setResult({ ok: false, message: "Não foi possível confirmar o cadastro. Verifique sua conexão e tente novamente." });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return <form className="flex flex-col gap-3" onSubmit={submit} aria-busy={pending}>
    <p className="text-[11px] leading-[1.7] text-white/75">
      Sem spam. Conteúdo com real valor para quem vive ou investe em imóveis
      de alto padrão. Cancele a qualquer momento.
    </p>
    <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="sr-only">Assinar newsletter</legend>
      <div className="flex">
        <input
          className="min-w-0 flex-1 border border-r-0 border-white/25 bg-white/10 px-[18px] py-[13px] text-xs text-white outline-none placeholder:text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          placeholder="seu@email.com" aria-label="Seu e-mail" type="email" name="email" autoComplete="email" required maxLength={254}
        />
        <button
          className="bg-navy px-6 py-[13px] text-[9px] uppercase tracking-[0.28em] text-white transition hover:bg-[#1d2e42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60 md:px-[26px]"
          type="submit"
        >{pending ? "Enviando" : "Assinar"}</button>
      </div>
      <label className="flex items-start gap-2 text-[11px] leading-[1.7] text-white/75">
        <input className="mt-1 shrink-0 accent-navy" type="checkbox" name="consent" required />
        <span>{NEWSLETTER_CONSENT}</span>
      </label>
    </fieldset>
    {result && <p role={result.ok ? "status" : "alert"} className="text-xs leading-relaxed text-white">{result.message}</p>}
  </form>;
}
