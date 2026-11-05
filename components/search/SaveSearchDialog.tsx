"use client";

import { useEffect, useRef, useState } from "react";
import type { ImovelSearchFilters } from "@/lib/queries/imoveis";
import { SEARCH_CONSENT, searchProfile } from "@/lib/saved-search";

export function SaveSearchDialog({ filters, onClose }: { filters: ImovelSearchFilters; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);

  return <dialog ref={dialog} aria-labelledby="save-search-title" onCancel={event => { if (submitting.current) event.preventDefault(); else onClose(); }}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-lg overflow-y-auto border border-navy/15 bg-offwhite p-6 text-navy backdrop:bg-navy/50 md:p-8">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 id="save-search-title" className="text-2xl font-light">Salva busca</h2>
      <button type="button" disabled={busy} onClick={onClose} className="min-h-11 px-2 text-xs text-terra underline disabled:opacity-50">Fechar</button>
    </div>
    <ul aria-label="Critérios da busca" className="mb-5 flex flex-wrap gap-x-4 gap-y-1 border-y border-navy/10 py-3 text-xs">
      {searchProfile(filters).map(item => <li key={item}>{item}</li>)}
    </ul>
    {filters.mapSelection ? <p role="status" className="text-sm">Para salvar, escolha um bairro ou condomínio nos filtros no lugar da seleção do mapa.</p> : !finished && <form aria-busy={busy} onSubmit={async event => {
      event.preventDefault();
      if (submitting.current) return;
      const form = new FormData(event.currentTarget);
      submitting.current = true; setBusy(true); setMessage(""); setError(false);
      try {
        const response = await fetch("/api/imoveis/salvar-busca", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), consent: form.get("consent") === "on", filters }),
        });
        const result = await response.json();
        setMessage(result.message || "Não foi possível confirmar o envio.");
        setReference(result.reference || "");
        setFinished(result.ok === true || result.pending === true || result.terminal === true);
        setError(result.ok !== true && result.pending !== true);
      } catch { setError(true); setMessage("Não foi possível confirmar o envio. Verifique sua conexão e tente novamente."); }
      finally { submitting.current = false; setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm">Nome
          <input autoFocus name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 min-h-11 w-full border border-navy/25 bg-transparent px-3 text-base focus:outline-terra" />
        </label>
        <label className="block text-sm">E-mail
          <input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1 min-h-11 w-full border border-navy/25 bg-transparent px-3 text-base focus:outline-terra" />
        </label>
        <label className="block text-sm">WhatsApp com DDD
          <input name="phone" type="tel" required minLength={10} maxLength={30} autoComplete="tel" placeholder="(43) 99999-9999" className="mt-1 min-h-11 w-full border border-navy/25 bg-transparent px-3 text-base focus:outline-terra" />
        </label>
        <label className="flex items-start gap-3 text-xs leading-relaxed">
          <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-terra" />
          <span>{SEARCH_CONSENT}</span>
        </label>
        <button type="submit" className="min-h-11 w-full bg-terra px-6 py-3 text-sm text-white disabled:opacity-50">{busy ? "Enviando..." : "Salva busca"}</button>
      </fieldset>
    </form>}
    <div role={error ? "alert" : "status"} aria-live="polite" className="mt-4 text-sm leading-relaxed">
      {message}
      {reference && <p className="mt-2 break-all text-xs">Protocolo: {reference}</p>}
      {finished && <a href="/contato" className="mt-3 inline-block text-terra underline">Falar com a equipe</a>}
    </div>
  </dialog>;
}
