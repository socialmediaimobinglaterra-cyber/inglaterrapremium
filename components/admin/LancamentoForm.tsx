"use client";

import { useEffect, useState } from "react";
import { saveLancamentoAction } from "@/app/admin/lancamentos/actions";

type LancamentoFormData = {
  id?: string;
  kenloCodigo?: string | null;
  nome?: string | null;
  slug?: string | null;
  bairroNome?: string | null;
  cidade?: string | null;
  estado?: string | null;
  imovelId?: string | null;
  ativo?: boolean;
  status?: string | null;
  entrega?: string | null;
  faixa?: string | null;
  metragens?: string | null;
  unidades?: string | null;
  endereco?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  descricao?: string | null;
  descricao2?: string | null;
  diferenciais?: string[];
  galeria?: Array<{ url: string; alt?: string }>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
        {label}
      </span>
      <input
        className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
        defaultValue={defaultValue ?? ""}
        name={name}
        required={required}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
        {label}
      </span>
      <textarea
        className="w-full resize-y border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
        defaultValue={defaultValue ?? ""}
        name={name}
        rows={rows}
      />
    </label>
  );
}

export function LancamentoForm({ lancamento }: { lancamento?: LancamentoFormData | null }) {
  const [nome, setNome] = useState(lancamento?.nome ?? "");
  const [slug, setSlug] = useState(lancamento?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(lancamento?.slug));

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nome));
  }, [nome, slugTouched]);

  const galeriaExistente =
    lancamento?.galeria
      ?.map((foto) => `${foto.url}${foto.alt ? ` | ${foto.alt}` : ""}`)
      .join("\n") ?? "";

  return (
    <form action={saveLancamentoAction} className="space-y-6" encType="multipart/form-data">
      {lancamento?.id ? <input name="id" type="hidden" value={lancamento.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Nome
          </span>
          <input
            className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
            name="nome"
            onChange={(event) => setNome(event.target.value)}
            required
            value={nome}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Slug
          </span>
          <input
            className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
            name="slug"
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            required
            value={slug}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field defaultValue={lancamento?.bairroNome} label="Bairro" name="bairro_nome" />
        <Field defaultValue={lancamento?.cidade ?? "Londrina"} label="Cidade" name="cidade" />
        <Field defaultValue={lancamento?.estado ?? "PR"} label="Estado" name="estado" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field defaultValue={lancamento?.status} label="Status" name="status" />
        <Field defaultValue={lancamento?.entrega} label="Entrega" name="entrega" />
        <Field defaultValue={lancamento?.faixa} label="Faixa de valor" name="faixa" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field defaultValue={lancamento?.metragens} label="Metragens" name="metragens" />
        <Field defaultValue={lancamento?.unidades} label="Unidades" name="unidades" />
        <Field defaultValue={lancamento?.endereco} label="Endereço" name="endereco" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field defaultValue={lancamento?.latitude} label="Latitude" name="latitude" />
        <Field defaultValue={lancamento?.longitude} label="Longitude" name="longitude" />
      </div>

      <TextArea defaultValue={lancamento?.descricao} label="Sobre" name="descricao" rows={5} />
      <TextArea
        defaultValue={lancamento?.descricao2}
        label="Sobre - segundo parágrafo"
        name="descricao2"
        rows={4}
      />
      <TextArea
        defaultValue={lancamento?.diferenciais?.join("\n")}
        label="Diferenciais - um por linha"
        name="diferenciais"
        rows={5}
      />

      <TextArea
        defaultValue={galeriaExistente}
        label="Galeria existente - uma URL por linha, opcionalmente URL | alt"
        name="galeria_existente"
        rows={Math.max(3, lancamento?.galeria?.length ?? 0)}
      />

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Novas imagens
        </span>
        <input
          accept="image/*"
          className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
          multiple
          name="galeria"
          type="file"
        />
        <span className="mt-1.5 block text-xs text-sand">
          Apenas imagens. Máximo de 8 arquivos por envio, 4 MB por imagem.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <Field defaultValue={lancamento?.kenloCodigo} label="Código Kenlo" name="kenlo_codigo" />
        <Field defaultValue={lancamento?.imovelId} label="Imóvel relacionado UUID" name="imovel_id" />
        <label className="flex items-end gap-2 pb-2 text-sm text-navy">
          <input defaultChecked={lancamento?.ativo ?? true} name="ativo" type="checkbox" />
          Ativo no site
        </label>
      </div>

      <button
        className="bg-terra px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
        type="submit"
      >
        Salvar lançamento
      </button>
    </form>
  );
}
