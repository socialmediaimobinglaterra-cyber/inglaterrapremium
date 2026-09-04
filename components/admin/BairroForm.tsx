"use client";

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
  descricao: string | null;
  faq: Array<{ pergunta: string; resposta: string }>;
};

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function newFaqItem(item?: Partial<FaqItem>): FaqItem {
  return {
    id: item?.id ?? crypto.randomUUID(),
    pergunta: item?.pergunta ?? "",
    resposta: item?.resposta ?? "",
  };
}

export function BairroForm({ bairro }: { bairro?: BairroFormData | null }) {
  const [formState, formAction, pending] = useActionState(saveBairroAction, {});
  const [existingCover, setExistingCover] = useState(bairro?.imagemCapa ?? null);
  const [selectedCover, setSelectedCover] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(
    bairro?.faq.length
      ? bairro.faq.map((item) => newFaqItem(item))
      : [newFaqItem()]
  );
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    setExistingCover(bairro?.imagemCapa ?? null);
    setSelectedCover(null);
    setFaqItems(
      bairro?.faq.length
        ? bairro.faq.map((item) => newFaqItem(item))
        : [newFaqItem()]
    );
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, [bairro?.id, bairro?.imagemCapa, bairro?.faq]);

  useEffect(() => {
    return () => {
      if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    };
  }, [selectedCover]);

  function handleCoverSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.currentTarget.files ?? []);
    if (!file) return;

    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    setSelectedCover({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeSelectedCover() {
    if (selectedCover) URL.revokeObjectURL(selectedCover.previewUrl);
    setSelectedCover(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

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
      <input name="imagem_capa_existente" type="hidden" value={existingCover ?? ""} />

      {formState.error ? (
        <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
          {formState.error}
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

      <div className="border border-navy/10 bg-offwhite p-4">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
          Imagem de capa
        </span>
        <p className="mb-3 text-xs leading-relaxed text-sand">
          Upload único para Home e topo da página do bairro. Use PNG, JPG ou WebP.
        </p>

        {existingCover && !selectedCover ? (
          <div className="mb-4 border border-navy/10 bg-white p-2">
            <div className="aspect-[21/9] overflow-hidden bg-offwhite">
              <img
                alt={`Imagem de capa de ${bairro.nome}`}
                className="h-full w-full object-cover"
                src={existingCover}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="line-clamp-1 text-xs text-sand">{existingCover}</p>
              <button
                className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                onClick={() => setExistingCover(null)}
                type="button"
              >
                Remover
              </button>
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
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="line-clamp-1 text-xs text-navy">{selectedCover.file.name}</p>
                <p className="mt-0.5 text-[11px] text-sand">
                  {formatBytes(selectedCover.file.size)}
                </p>
              </div>
              <button
                className="border border-navy/15 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                onClick={removeSelectedCover}
                type="button"
              >
                Remover
              </button>
            </div>
          </div>
        ) : null}

        <input
          accept="image/*"
          className="w-full border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy file:mr-4 file:border-0 file:bg-navy file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.16em] file:text-white"
          name="imagem_capa"
          onChange={handleCoverSelect}
          ref={coverInputRef}
          type="file"
        />
        <span className="mt-1.5 block text-xs text-sand">
          Apenas imagem. Máximo de 4 MB.
        </span>
      </div>

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
            onClick={() => setFaqItems((current) => [...current, newFaqItem()])}
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
                        ? [newFaqItem()]
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
