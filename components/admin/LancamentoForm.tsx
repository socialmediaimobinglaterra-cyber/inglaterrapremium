"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
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

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function LancamentoForm({ lancamento }: { lancamento?: LancamentoFormData | null }) {
  const [formState, formAction, pending] = useActionState(saveLancamentoAction, {});
  const [nome, setNome] = useState(lancamento?.nome ?? "");
  const [slug, setSlug] = useState(lancamento?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(lancamento?.slug));
  const [existingImages, setExistingImages] = useState(lancamento?.galeria ?? []);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nome));
  }, [nome, slugTouched]);

  useEffect(() => {
    setExistingImages(lancamento?.galeria ?? []);
    setSelectedImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [lancamento?.id, lancamento?.galeria]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const galeriaExistente = useMemo(
    () =>
      existingImages
        .map((foto) => `${foto.url}${foto.alt ? ` | ${foto.alt}` : ""}`)
        .join("\n"),
    [existingImages]
  );

  function syncFileInput(images: SelectedImage[]) {
    if (!fileInputRef.current || typeof DataTransfer === "undefined") return;

    const transfer = new DataTransfer();
    images.forEach((image) => transfer.items.add(image.file));
    fileInputRef.current.files = transfer.files;
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (!files.length) return;

    const images = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl,
      };
    });
    const nextImages = [...selectedImages, ...images].slice(0, 8);

    selectedImages
      .concat(images)
      .slice(8)
      .forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages(nextImages);
    syncFileInput(nextImages);
  }

  function removeSelectedImage(id: string) {
    const removed = selectedImages.find((image) => image.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);

    const nextImages = selectedImages.filter((image) => image.id !== id);
    setSelectedImages(nextImages);
    syncFileInput(nextImages);
  }

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      {lancamento?.id ? <input name="id" type="hidden" value={lancamento.id} /> : null}
      {formState.error ? (
        <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
          {formState.error}
        </p>
      ) : null}

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

      <textarea className="hidden" name="galeria_existente" readOnly value={galeriaExistente} />

      {existingImages.length > 0 ? (
        <div>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Imagens salvas
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingImages.map((image, index) => (
              <div className="border border-navy/10 bg-offwhite p-2" key={`${image.url}-${index}`}>
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  <img
                    alt={image.alt || `${lancamento?.nome ?? "Lançamento"} - foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={image.url}
                  />
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-xs text-sand">{image.alt || image.url}</p>
                  <button
                    className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                    onClick={() =>
                      setExistingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Novas imagens
        </span>
        <input
          accept="image/*"
          className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
          multiple
          name="galeria"
          onChange={handleImageSelect}
          ref={fileInputRef}
          type="file"
        />
        <span className="mt-1.5 block text-xs text-sand">
          Apenas imagens. Máximo de 8 arquivos por envio, 4 MB por imagem.
        </span>
      </label>

      {selectedImages.length > 0 ? (
        <div>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Imagens selecionadas
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedImages.map((image) => (
              <div className="border border-navy/10 bg-offwhite p-2" key={image.id}>
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  <img
                    alt={image.file.name}
                    className="h-full w-full object-cover"
                    src={image.previewUrl}
                  />
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="line-clamp-1 text-xs text-navy">{image.file.name}</p>
                    <p className="mt-0.5 text-[11px] text-sand">{formatBytes(image.file.size)}</p>
                  </div>
                  <button
                    className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                    onClick={() => removeSelectedImage(image.id)}
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvando..." : "Salvar lançamento"}
      </button>
    </form>
  );
}
