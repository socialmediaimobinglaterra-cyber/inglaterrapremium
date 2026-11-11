"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBanner } from "@/lib/admin/banners";
import { saveBannerAction } from "@/app/admin/banners/actions";

const inputClass = "mt-1 w-full min-w-0 border border-navy/20 bg-white px-3 py-2.5 text-base focus:outline-terra";
const buttonClass = "min-h-11 border border-navy/20 px-4 py-2 text-sm disabled:opacity-50";

function BannerEditor({ banner, onClose }: { banner?: AdminBanner; onClose: () => void }) {
  const [file, setFile] = useState<File>();
  const [draft, setDraft] = useState({ alt: banner?.alt ?? "", link: banner?.href ?? "", ordem: String(banner?.ordem ?? 0), ativo: banner?.ativo ?? false });
  const [state, action, pending] = useActionState(async (previous: { error?: string; ok?: boolean }, data: FormData) => {
    if (file) data.set("imagem", file);
    return saveBannerAction(previous, data);
  }, {});
  const [preview, setPreview] = useState(banner?.image);
  const router = useRouter();
  useEffect(() => {
    if (!file) { setPreview(banner?.image); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, banner?.image]);
  useEffect(() => { if (state.ok) { router.refresh(); onClose(); } }, [state.ok, router, onClose]);
  return <form action={action} className="mb-8 border-y border-navy/15 py-6">
    <input type="hidden" name="id" value={banner?.id ?? ""} />
    <fieldset disabled={pending} className="grid min-w-0 gap-5 md:grid-cols-2">
      <legend className="mb-4 text-xl font-light">{banner ? "Editar banner" : "Novo banner"}</legend>
      <label className="min-w-0 text-sm">Imagem (JPG, PNG ou WebP, até 8 MB)
        <input className={inputClass} type="file" name="imagem" accept="image/jpeg,image/png,image/webp" required={!banner && !file} onChange={event => setFile(event.target.files?.[0])} />
      </label>
      {preview ? <img src={preview} alt="Prévia do banner" className="h-28 max-w-full object-contain" /> : <div />}
      <label className="min-w-0 text-sm">Descrição da imagem
        <input className={inputClass} name="alt" required maxLength={500} value={draft.alt} onChange={event => setDraft({ ...draft, alt: event.target.value })} />
      </label>
      <label className="min-w-0 text-sm">Link de destino (opcional)
        <input className={inputClass} name="link" maxLength={2000} value={draft.link} onChange={event => setDraft({ ...draft, link: event.target.value })} placeholder="https://... ou /contato" />
      </label>
      <label className="text-sm">Ordem
        <input className={inputClass} name="ordem" type="number" min="0" max="100000" step="1" required value={draft.ordem} onChange={event => setDraft({ ...draft, ordem: event.target.value })} />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input name="ativo" type="checkbox" checked={draft.ativo} onChange={event => setDraft({ ...draft, ativo: event.target.checked })} />Ativo na Home</label>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button className={`${buttonClass} border-terra bg-terra text-white`} type="submit">{pending ? "Salvando..." : "Salvar banner"}</button>
        <button className={buttonClass} type="button" onClick={onClose}>Cancelar</button>
      </div>
    </fieldset>
    {state.error ? <p role="alert" className="mt-4 text-sm text-terra">{state.error}</p> : null}
  </form>;
}

function RemoveBanner({ id }: { id: string }) {
  const [state, action, pending] = useActionState(saveBannerAction, {});
  const router = useRouter();
  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);
  return <form action={action} onSubmit={event => { if (!window.confirm("Remover este banner?")) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="operation" value="delete" />
    <button type="submit" disabled={pending} className={`${buttonClass} hover:border-red-700 hover:text-red-700`}>{pending ? "Removendo..." : "Remover"}</button>
    {state.error ? <p role="alert" className="text-sm text-terra">{state.error}</p> : null}
  </form>;
}

export function BannerManager({ banners }: { banners: AdminBanner[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  return <>
    {editing === null ? <button type="button" className={`${buttonClass} mb-6 border-terra text-terra`} onClick={() => setEditing("new")}>Adicionar banner</button> :
      <BannerEditor key={editing} banner={banners.find(banner => banner.id === editing)} onClose={() => setEditing(null)} />}
    {!banners.length ? <p className="text-sm text-sand">Nenhum banner cadastrado.</p> :
      <ul className="divide-y divide-navy/10 border-y border-navy/10">
        {banners.map(banner => <li key={banner.id} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 py-4 sm:grid-cols-[128px_minmax(0,1fr)_auto]">
          <img src={banner.image} alt={banner.alt} className="h-20 w-24 object-contain sm:w-32" />
          <div className="min-w-0 flex-1"><p className="break-words text-sm">{banner.alt}</p><p className="mt-1 text-sm text-sand">Ordem {banner.ordem} · {banner.ativo ? "Ativo" : "Inativo"}</p></div>
          <div className="col-span-2 flex gap-2 sm:col-span-1"><button type="button" className={buttonClass} onClick={() => setEditing(banner.id)}>Editar</button><RemoveBanner id={banner.id} /></div>
        </li>)}
      </ul>}
  </>;
}
