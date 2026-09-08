"use client";

import type { ChangeEvent, RefObject } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveBairroAction } from "@/app/admin/bairros/actions";

type FaqItem = {
  id: string;
  pergunta: string;
  resposta: string;
};

type BairroFormData = {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  imagemCapa: string | null;
  imagemCapaAlinhamento: string;
  imagemHome: string | null;
  imagemHomeAlinhamento: string;
  descricao: string | null;
  faq: Array<{ pergunta: string; resposta: string }>;
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

type SelectedImage = {
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_HOME_IMAGE_SIZE = 3 * 1024 * 1024;

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

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function newFaqItem(item?: Partial<FaqItem>, fallbackId = "faq-0"): FaqItem {
  return {
    id: item?.id ?? fallbackId,
    pergunta: item?.pergunta ?? "",
    resposta: item?.resposta ?? "",
  };
}

function createFaqItem(): FaqItem {
  return newFaqItem(
    undefined,
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `faq-${Date.now()}`
  );
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
  name: string;
  value: ImagePosition;
  onChange: (value: ImagePosition) => void;
}) {
  return (
    <div>
      <input name={name} type="hidden" value={value} />
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

function ImageUploadBlock({
  title,
  description,
  recommended,
  existingName,
  inputName,
  alignmentName,
  existingUrl,
  selectedImage,
  position,
  maxSize,
  previewAspect,
  onExistingChange,
  onSelectedChange,
  onPositionChange,
  inputRef,
  bairroNome,
  setUploadError,
}: {
  title: string;
  description: string;
  recommended: string;
  existingName: string;
  inputName: string;
  alignmentName: string;
  existingUrl: string | null;
  selectedImage: SelectedImage | null;
  position: ImagePosition;
  maxSize: number;
  previewAspect: string;
  onExistingChange: (value: string | null) => void;
  onSelectedChange: (value: SelectedImage | null) => void;
  onPositionChange: (value: ImagePosition) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  bairroNome: string;
  setUploadError: (value: string | null) => void;
}) {
  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.currentTarget.files ?? []);
    if (!file) return;

    if (file.size > maxSize) {
      setUploadError(
        `A imagem de ${title.toLowerCase()} excedeu o tamanho limite de ${formatBytes(maxSize)}.`
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploadError(null);
    if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    onSelectedChange({ file, previewUrl, width: null, height: null });

    const probe = new window.Image();
    probe.onload = () => {
      onSelectedChange({
        file,
        previewUrl,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
      });
    };
    probe.onerror = () => {
      onSelectedChange({ file, previewUrl, width: null, height: null });
    };
    probe.src = previewUrl;
  }

  function removeSelectedImage() {
    if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    onSelectedChange(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="border border-navy/10 bg-offwhite p-4">
      <input name={existingName} type="hidden" value={existingUrl ?? ""} />
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
        {title}
      </span>
      <p className="mb-1 text-xs leading-relaxed text-sand">{description}</p>
      <p className="mb-3 text-xs leading-relaxed text-navy">
        Recomendado: {recommended}. Tamanho máximo: {formatBytes(maxSize)}.
      </p>

      {existingUrl && !selectedImage ? (
        <div className="mb-4 border border-navy/10 bg-white p-2">
          <div className={`${previewAspect} overflow-hidden bg-offwhite`}>
            <img
              alt={`${title} de ${bairroNome}`}
              className="h-full w-full object-cover"
              src={existingUrl}
              style={{ objectPosition: position }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="line-clamp-1 text-xs text-sand">{existingUrl}</p>
            <div className="flex shrink-0 items-start gap-3">
              <ImageAlignmentGrid
                name={alignmentName}
                value={position}
                onChange={onPositionChange}
              />
              <button
                className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                onClick={() => onExistingChange(null)}
                type="button"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedImage ? (
        <div className="mb-4 border border-navy/10 bg-white p-2">
          <div className={`${previewAspect} overflow-hidden bg-offwhite`}>
            <img
              alt={selectedImage.file.name}
              className="h-full w-full object-cover"
              src={selectedImage.previewUrl}
              style={{ objectPosition: position }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="line-clamp-1 text-xs text-navy">{selectedImage.file.name}</p>
              <p className="mt-0.5 text-[11px] text-sand">
                {selectedImage.width && selectedImage.height
                  ? `${selectedImage.width} x ${selectedImage.height} px · `
                  : ""}
                {formatBytes(selectedImage.file.size)}
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-3">
              <ImageAlignmentGrid
                name={alignmentName}
                value={position}
                onChange={onPositionChange}
              />
              <button
                className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                onClick={removeSelectedImage}
                type="button"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!existingUrl && !selectedImage ? (
        <ImageAlignmentGrid
          name={alignmentName}
          value={position}
          onChange={onPositionChange}
        />
      ) : null}

      <input
        accept="image/*"
        className="mt-3 w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
        name={inputName}
        onChange={handleSelect}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}

export function BairroForm({ bairro }: { bairro?: BairroFormData | null }) {
  const [formState, formAction, pending] = useActionState(saveBairroAction, {});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState(bairro?.imagemCapa ?? null);
  const [existingHomeImage, setExistingHomeImage] = useState(bairro?.imagemHome ?? null);
  const [coverPosition, setCoverPosition] = useState<ImagePosition>(
    normalizePosition(bairro?.imagemCapaAlinhamento)
  );
  const [homeImagePosition, setHomeImagePosition] = useState<ImagePosition>(
    normalizePosition(bairro?.imagemHomeAlinhamento)
  );
  const [selectedCover, setSelectedCover] = useState<SelectedImage | null>(null);
  const [selectedHomeImage, setSelectedHomeImage] = useState<SelectedImage | null>(null);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(
    bairro?.faq.length
      ? bairro.faq.map((item, index) => newFaqItem(item, `faq-${index}`))
      : [newFaqItem(undefined, "faq-0")]
  );
  const coverInputRef = useRef<HTMLInputElement>(null);
  const homeImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    if (selectedHomeImage) URL.revokeObjectURL(selectedHomeImage.previewUrl);
    setExistingCover(bairro?.imagemCapa ?? null);
    setExistingHomeImage(bairro?.imagemHome ?? null);
    setUploadError(null);
    setCoverPosition(normalizePosition(bairro?.imagemCapaAlinhamento));
    setHomeImagePosition(normalizePosition(bairro?.imagemHomeAlinhamento));
    setSelectedCover(null);
    setSelectedHomeImage(null);
    setFaqItems(
      bairro?.faq.length
        ? bairro.faq.map((item, index) => newFaqItem(item, `faq-${index}`))
        : [newFaqItem(undefined, "faq-0")]
    );
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (homeImageInputRef.current) homeImageInputRef.current.value = "";
  }, [
    bairro?.id,
    bairro?.imagemCapa,
    bairro?.imagemCapaAlinhamento,
    bairro?.imagemHome,
    bairro?.imagemHomeAlinhamento,
    bairro?.faq,
  ]);

  useEffect(() => {
    return () => {
      if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
      if (selectedHomeImage) URL.revokeObjectURL(selectedHomeImage.previewUrl);
    };
  }, [selectedCover, selectedHomeImage]);

  function updateFaq(id: string, field: "pergunta" | "resposta", value: string) {
    setFaqItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  if (!bairro) {
    return (
      <div className="border border-dashed border-navy/20 bg-offwhite p-6 text-sm leading-relaxed text-sand">
        Selecione um bairro na lista para editar imagem de capa, descrição e FAQ.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <input name="id" type="hidden" value={bairro.id} />

      {formState.error ? (
        <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
          {formState.error}
        </p>
      ) : null}

      {uploadError ? (
        <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
          {uploadError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Bairro
          </span>
          <input
            className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none"
            readOnly
            value={bairro.nome}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
            Slug
          </span>
          <input
            className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none"
            readOnly
            value={bairro.slug}
          />
        </label>
      </div>

      <ImageUploadBlock
        alignmentName="imagem_capa_alinhamento"
        bairroNome={bairro.nome}
        description="Imagem grande usada no topo da página pública do bairro. Use PNG, JPG ou WebP."
        existingName="imagem_capa_existente"
        existingUrl={existingCover}
        inputName="imagem_capa"
        inputRef={coverInputRef}
        maxSize={MAX_COVER_IMAGE_SIZE}
        onExistingChange={setExistingCover}
        onPositionChange={setCoverPosition}
        onSelectedChange={setSelectedCover}
        position={coverPosition}
        previewAspect="aspect-[21/9]"
        recommended="2560 x 1100 px, mínimo 1920 x 820 px"
        selectedImage={selectedCover}
        setUploadError={setUploadError}
        title="Imagem de capa da página"
      />

      <ImageUploadBlock
        alignmentName="imagem_home_alinhamento"
        bairroNome={bairro.nome}
        description="Imagem própria para o card do bairro na Home, com enquadramento diferente da capa."
        existingName="imagem_home_existente"
        existingUrl={existingHomeImage}
        inputName="imagem_home"
        inputRef={homeImageInputRef}
        maxSize={MAX_HOME_IMAGE_SIZE}
        onExistingChange={setExistingHomeImage}
        onPositionChange={setHomeImagePosition}
        onSelectedChange={setSelectedHomeImage}
        position={homeImagePosition}
        previewAspect="aspect-[4/5]"
        recommended="1200 x 1500 px, mínimo 900 x 1125 px"
        selectedImage={selectedHomeImage}
        setUploadError={setUploadError}
        title="Imagem da Home"
      />

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Descrição
        </span>
        <textarea
          className="min-h-44 w-full resize-y border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
          defaultValue={bairro.descricao ?? ""}
          name="descricao"
        />
      </label>

      <div className="border border-navy/10 bg-offwhite p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
              FAQ
            </span>
            <p className="text-xs leading-relaxed text-sand">
              Perguntas e respostas salvas como JSON estruturado.
            </p>
          </div>
          <button
            className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
            onClick={() => setFaqItems((current) => [...current, createFaqItem()])}
            type="button"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div className="border border-navy/10 bg-white p-3" key={item.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy">
                  Item {index + 1}
                </p>
                <button
                  className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                  onClick={() =>
                    setFaqItems((current) =>
                      current.length === 1
                        ? [createFaqItem()]
                        : current.filter((currentItem) => currentItem.id !== item.id)
                    )
                  }
                  type="button"
                >
                  Remover
                </button>
              </div>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
                  Pergunta
                </span>
                <input
                  className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
                  name="faq_pergunta"
                  onChange={(event) => updateFaq(item.id, "pergunta", event.target.value)}
                  value={item.pergunta}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
                  Resposta
                </span>
                <textarea
                  className="min-h-28 w-full resize-y border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
                  name="faq_resposta"
                  onChange={(event) => updateFaq(item.id, "resposta", event.target.value)}
                  value={item.resposta}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        className="bg-terra px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvando..." : "Salvar bairro"}
      </button>
    </form>
  );
}
