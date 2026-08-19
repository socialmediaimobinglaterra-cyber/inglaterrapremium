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
  construtoraNome?: string | null;
  construtoraLogo?: { url: string; alt?: string; position?: string } | null;
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
  capa?: { url: string; alt?: string; position?: string } | null;
  galeria?: Array<{ url: string; alt?: string; position?: string }>;
};

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
  position: ImagePosition;
};

type ImagePosition =
  | "left top"
  | "center top"
  | "right top"
  | "left center"
  | "center center"
  | "right center"
  | "left bottom"
  | "center bottom"
  | "right bottom";

type EditableImage = {
  url: string;
  alt?: string;
  position?: string;
};

const imagePositions: Array<{ value: ImagePosition; label: string }> = [
  { value: "left top", label: "TL" },
  { value: "center top", label: "TC" },
  { value: "right top", label: "TR" },
  { value: "left center", label: "CL" },
  { value: "center center", label: "C" },
  { value: "right center", label: "CR" },
  { value: "left bottom", label: "BL" },
  { value: "center bottom", label: "BC" },
  { value: "right bottom", label: "BR" },
];

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

function normalizePosition(value?: string | null): ImagePosition {
  return imagePositions.some((item) => item.value === value)
    ? (value as ImagePosition)
    : "center center";
}

function ImageAlignmentGrid({
  name,
  value,
  onChange,
}: {
  name?: string;
  value: ImagePosition;
  onChange: (value: ImagePosition) => void;
}) {
  return (
    <div>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-sand">
        Alinhamento
      </span>
      <div className="grid w-[94px] grid-cols-3 gap-1">
        {imagePositions.map((position) => (
          <button
            aria-label={`Alinhar imagem: ${position.value}`}
            className={`h-7 border text-[11px] ${
              value === position.value
                ? "border-navy bg-navy text-white"
                : "border-navy/15 bg-white text-sand hover:border-terra hover:text-terra"
            }`}
            key={position.value}
            onClick={() => onChange(position.value)}
            type="button"
          >
            {position.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LancamentoForm({ lancamento }: { lancamento?: LancamentoFormData | null }) {
  const [formState, formAction, pending] = useActionState(saveLancamentoAction, {});
  const [nome, setNome] = useState(lancamento?.nome ?? "");
  const [slug, setSlug] = useState(lancamento?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(lancamento?.slug));
  const [existingCover, setExistingCover] = useState<EditableImage | null>(
    lancamento?.capa ?? null
  );
  const [selectedCover, setSelectedCover] = useState<SelectedImage | null>(null);
  const [existingBuilderLogo, setExistingBuilderLogo] = useState<EditableImage | null>(
    lancamento?.construtoraLogo ?? null
  );
  const [selectedBuilderLogo, setSelectedBuilderLogo] = useState<SelectedImage | null>(null);
  const [existingImages, setExistingImages] = useState<EditableImage[]>(
    lancamento?.galeria ?? []
  );
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const builderLogoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nome));
  }, [nome, slugTouched]);

  useEffect(() => {
    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    if (selectedBuilderLogo) URL.revokeObjectURL(selectedBuilderLogo.previewUrl);
    setExistingCover(lancamento?.capa ?? null);
    setSelectedCover(null);
    setExistingBuilderLogo(lancamento?.construtoraLogo ?? null);
    setSelectedBuilderLogo(null);
    setExistingImages(lancamento?.galeria ?? []);
    setSelectedImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (builderLogoInputRef.current) builderLogoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [lancamento?.id, lancamento?.capa, lancamento?.construtoraLogo, lancamento?.galeria]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const capaExistente = useMemo(
    () => (existingCover ? JSON.stringify([{ ...existingCover, position: normalizePosition(existingCover.position) }]) : ""),
    [existingCover]
  );

  const construtoraLogoExistente = useMemo(
    () => (existingBuilderLogo ? JSON.stringify([{ ...existingBuilderLogo }]) : ""),
    [existingBuilderLogo]
  );

  const galeriaExistente = useMemo(
    () =>
      JSON.stringify(
        existingImages.map((foto) => ({
          ...foto,
          position: normalizePosition(foto.position),
        }))
      ),
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
        position: "center center" as ImagePosition,
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

  function handleCoverSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.currentTarget.files ?? []);
    if (!file) return;

    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    setSelectedCover({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl,
      position: "center center",
    });
  }

  function handleBuilderLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.currentTarget.files ?? []);
    if (!file) return;

    if (selectedBuilderLogo) URL.revokeObjectURL(selectedBuilderLogo.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    setSelectedBuilderLogo({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl,
      position: "center center",
    });
  }

  function removeSelectedCover() {
    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    setSelectedCover(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function removeSelectedBuilderLogo() {
    if (selectedBuilderLogo) URL.revokeObjectURL(selectedBuilderLogo.previewUrl);
    setSelectedBuilderLogo(null);
    if (builderLogoInputRef.current) builderLogoInputRef.current.value = "";
  }

  function updateSelectedImagePosition(id: string, position: ImagePosition) {
    setSelectedImages((current) =>
      current.map((image) => (image.id === id ? { ...image, position } : image))
    );
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
        <Field
          defaultValue={lancamento?.construtoraNome}
          label="Nome da construtora"
          name="construtora_nome"
        />
        <Field defaultValue={lancamento?.entrega} label="Entrega" name="entrega" />
      </div>

      <textarea
        className="hidden"
        name="construtora_logo_existente"
        readOnly
        value={construtoraLogoExistente}
      />

      <div className="border border-navy/10 bg-offwhite p-4">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Logo da construtora
        </span>
        <p className="mb-3 text-xs leading-relaxed text-sand">
          Campo opcional. Use arquivo de imagem em PNG, JPG ou WebP.
        </p>

        {existingBuilderLogo && !selectedBuilderLogo ? (
          <div className="mb-4 flex items-center justify-between gap-3 border border-navy/10 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden border border-navy/10 bg-offwhite p-2">
                <img
                  alt={existingBuilderLogo.alt || "Logo da construtora"}
                  className="max-h-full max-w-full object-contain"
                  src={existingBuilderLogo.url}
                />
              </div>
              <p className="line-clamp-2 text-xs text-sand">
                {existingBuilderLogo.alt || existingBuilderLogo.url}
              </p>
            </div>
            <button
              className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
              onClick={() => setExistingBuilderLogo(null)}
              type="button"
            >
              Remover
            </button>
          </div>
        ) : null}

        {selectedBuilderLogo ? (
          <div className="mb-4 flex items-center justify-between gap-3 border border-navy/10 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden border border-navy/10 bg-offwhite p-2">
                <img
                  alt={selectedBuilderLogo.file.name}
                  className="max-h-full max-w-full object-contain"
                  src={selectedBuilderLogo.previewUrl}
                />
              </div>
              <div>
                <p className="line-clamp-1 text-xs text-navy">{selectedBuilderLogo.file.name}</p>
                <p className="mt-0.5 text-[11px] text-sand">
                  {formatBytes(selectedBuilderLogo.file.size)}
                </p>
              </div>
            </div>
            <button
              className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
              onClick={removeSelectedBuilderLogo}
              type="button"
            >
              Remover
            </button>
          </div>
        ) : null}

        <input
          accept="image/*"
          className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
          name="construtora_logo"
          onChange={handleBuilderLogoSelect}
          ref={builderLogoInputRef}
          type="file"
        />
        <span className="mt-1.5 block text-xs text-sand">
          Opcional. Máximo de 4 MB.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field defaultValue={lancamento?.faixa} label="Faixa de valor" name="faixa" />
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

      <textarea className="hidden" name="capa_existente" readOnly value={capaExistente} />
      <textarea className="hidden" name="galeria_existente" readOnly value={galeriaExistente} />

      <div className="border border-navy/10 bg-offwhite p-4">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Imagem de capa
        </span>
        <p className="mb-3 text-xs leading-relaxed text-sand">
          Use uma imagem própria para o topo da página. O alinhamento 3x3 define qual área da imagem fica em foco no corte panorâmico.
        </p>

        {existingCover && !selectedCover ? (
          <div className="mb-4 border border-navy/10 bg-white p-2">
            <div className="aspect-[21/9] overflow-hidden bg-offwhite">
              <img
                alt={existingCover.alt || `${lancamento?.nome ?? "Lançamento"} - capa`}
                className="h-full w-full object-cover"
                src={existingCover.url}
                style={{ objectPosition: normalizePosition(existingCover.position) }}
              />
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="line-clamp-2 text-xs text-sand">{existingCover.alt || existingCover.url}</p>
              <div className="flex shrink-0 items-start gap-3">
                <ImageAlignmentGrid
                  value={normalizePosition(existingCover.position)}
                  onChange={(position) =>
                    setExistingCover((current) => (current ? { ...current, position } : current))
                  }
                />
                <button
                  className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                  onClick={() => setExistingCover(null)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedCover ? (
          <div className="mb-4 border border-navy/10 bg-white p-2">
            <div className="aspect-[21/9] overflow-hidden bg-offwhite">
              <img
                alt={selectedCover.file.name}
                className="h-full w-full object-cover"
                src={selectedCover.previewUrl}
                style={{ objectPosition: selectedCover.position }}
              />
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="line-clamp-1 text-xs text-navy">{selectedCover.file.name}</p>
                <p className="mt-0.5 text-[11px] text-sand">{formatBytes(selectedCover.file.size)}</p>
              </div>
              <div className="flex shrink-0 items-start gap-3">
                <ImageAlignmentGrid
                  name="capa_alinhamento"
                  value={selectedCover.position}
                  onChange={(position) => setSelectedCover((current) => current ? { ...current, position } : current)}
                />
                <button
                  className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                  onClick={removeSelectedCover}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <input
          accept="image/*"
          className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
          name="capa"
          onChange={handleCoverSelect}
          ref={coverInputRef}
          type="file"
        />
        <span className="mt-1.5 block text-xs text-sand">
          Apenas imagem. Máximo de 4 MB.
        </span>
      </div>

      {existingImages.length > 0 ? (
        <div>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Imagens salvas na galeria
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingImages.map((image, index) => (
              <div className="border border-navy/10 bg-offwhite p-2" key={`${image.url}-${index}`}>
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  <img
                    alt={image.alt || `${lancamento?.nome ?? "Lançamento"} - foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={image.url}
                    style={{ objectPosition: normalizePosition(image.position) }}
                  />
                </div>
                <div className="mt-2 flex flex-col gap-3">
                  <p className="line-clamp-2 text-xs text-sand">{image.alt || image.url}</p>
                  <div className="flex items-start justify-between gap-2">
                    <ImageAlignmentGrid
                      value={normalizePosition(image.position)}
                      onChange={(position) =>
                        setExistingImages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, position } : item
                          )
                        )
                      }
                    />
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
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Novas imagens da galeria
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
            Imagens selecionadas para galeria
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedImages.map((image) => (
              <div className="border border-navy/10 bg-offwhite p-2" key={image.id}>
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  <img
                    alt={image.file.name}
                    className="h-full w-full object-cover"
                    src={image.previewUrl}
                    style={{ objectPosition: image.position }}
                  />
                </div>
                <div className="mt-2 flex flex-col gap-3">
                  <div>
                    <p className="line-clamp-1 text-xs text-navy">{image.file.name}</p>
                    <p className="mt-0.5 text-[11px] text-sand">{formatBytes(image.file.size)}</p>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <ImageAlignmentGrid
                      name="galeria_alinhamento"
                      value={image.position}
                      onChange={(position) => updateSelectedImagePosition(image.id, position)}
                    />
                    <button
                      className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                      onClick={() => removeSelectedImage(image.id)}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
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
