"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGES = 8;

export type SaveLancamentoState = {
  error?: string;
};

type GalleryItem = {
  url: string;
  alt: string;
  principal: boolean;
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

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function textLines(value: string | null) {
  if (!value) return [];
  return value
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[*\-\u2022]\s*/, "").trim())
    .filter(Boolean);
}

function parseGalleryLines(value: string | null, nome: string): GalleryItem[] {
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map((line, index) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [url, alt] = line.split("|").map((part) => part.trim());
      return {
        url,
        alt: alt || `${nome} - foto ${index + 1}`,
        principal: index === 0,
      };
    })
    .filter((item) => item.url.startsWith("http"));
}

function blobErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "";
  }

  return ` Detalhe do Blob: ${error.message.replace(
    /vercel_blob_rw_[A-Za-z0-9_-]+/g,
    "[token oculto]"
  )}`;
}

async function uploadImages(files: FormDataEntryValue[], nome: string) {
  const images = files.filter((file): file is File => file instanceof File && file.size > 0);
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (images.length > 0 && !token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não está disponível no ambiente de produção usado por este deploy."
    );
  }

  if (images.length > MAX_IMAGES) {
    throw new Error(`Envie no máximo ${MAX_IMAGES} imagens por vez.`);
  }

  const uploaded: GalleryItem[] = [];
  for (const [index, image] of images.entries()) {
    if (!image.type.startsWith("image/")) {
      throw new Error("Todos os arquivos enviados precisam ser imagens.");
    }

    if (image.size > MAX_IMAGE_SIZE) {
      throw new Error("Cada imagem deve ter no máximo 4 MB.");
    }

    const safeName = slugify(image.name.replace(/\.[^.]+$/, "")) || `imagem-${index + 1}`;
    const extension = image.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";
    try {
      const blob = await put(`lancamentos/${slugify(nome)}/${safeName}${extension}`, image, {
        access: "public",
        addRandomSuffix: true,
        token,
      });

      uploaded.push({
        url: blob.url,
        alt: `${nome} - foto ${index + 1}`,
        principal: false,
      });
    } catch (error) {
      console.error("Falha no upload para Vercel Blob", error);
      throw new Error(
        `Não foi possível enviar as imagens para o Vercel Blob. Confira o BLOB_READ_WRITE_TOKEN no projeto de produção correto.${blobErrorMessage(error)}`
      );
    }
  }

  return uploaded;
}

async function requireEditor() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

function buildRaw(formData: FormData, galeria: GalleryItem[]) {
  return {
    status: stringValue(formData, "status"),
    entrega: stringValue(formData, "entrega"),
    faixa: stringValue(formData, "faixa"),
    metragens: stringValue(formData, "metragens"),
    unidades: stringValue(formData, "unidades"),
    endereco: stringValue(formData, "endereco"),
    latitude: stringValue(formData, "latitude"),
    longitude: stringValue(formData, "longitude"),
    descricao: stringValue(formData, "descricao"),
    descricao2: stringValue(formData, "descricao2"),
    diferenciais: textLines(stringValue(formData, "diferenciais")),
    galeria,
  };
}

function errorState(error: unknown): SaveLancamentoState {
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }

  return {
    error:
      "Não foi possível salvar o lançamento agora. Confira os campos e tente novamente.",
  };
}

export async function saveLancamentoAction(
  _previousState: SaveLancamentoState,
  formData: FormData
): Promise<SaveLancamentoState> {
  await requireEditor();

  const id = stringValue(formData, "id");
  const nome = stringValue(formData, "nome");
  if (!nome) return { error: "Informe o nome do lançamento." };

  const slug = slugify(stringValue(formData, "slug") ?? nome);
  if (!slug) return { error: "Informe um slug válido para o lançamento." };

  try {
    const existingGallery = parseGalleryLines(stringValue(formData, "galeria_existente"), nome);
    const uploadedGallery = await uploadImages(formData.getAll("galeria"), nome);
    const galeria = [...existingGallery, ...uploadedGallery].map((item, index) => ({
      ...item,
      principal: index === 0,
    }));
    const raw = buildRaw(formData, galeria);

    const values = [
      stringValue(formData, "kenlo_codigo"),
      nome,
      slug,
      stringValue(formData, "bairro_nome"),
      stringValue(formData, "cidade") ?? "Londrina",
      stringValue(formData, "estado") ?? "PR",
      stringValue(formData, "imovel_id"),
      JSON.stringify(raw),
      formData.get("ativo") === "on",
    ];

    if (id) {
      await getPool().query(
        `
          update lancamentos
          set kenlo_codigo = $1,
            nome = $2,
            slug = $3,
            bairro_nome = $4,
            cidade = $5,
            estado = $6,
            imovel_id = nullif($7, '')::uuid,
            raw = $8::jsonb,
            ativo = $9,
            updated_at = now()
          where id = $10
        `,
        [...values, id]
      );
    } else {
      await getPool().query(
        `
          insert into lancamentos (
            kenlo_codigo, nome, slug, bairro_nome, cidade, estado,
            imovel_id, raw, ativo, last_seen_at
          )
          values ($1, $2, $3, $4, $5, $6, nullif($7, '')::uuid, $8::jsonb, $9, now())
        `,
        values
      );
    }

    revalidatePath("/");
    revalidatePath("/lancamentos/[slug]", "page");
    revalidatePath("/admin/lancamentos");
  } catch (error) {
    console.error("Erro ao salvar lançamento", error);
    return errorState(error);
  }

  redirect("/admin/lancamentos?ok=1");
}

export async function deleteLancamentoAction(formData: FormData) {
  await requireEditor();

  const id = stringValue(formData, "id");
  if (!id) redirect("/admin/lancamentos?erro=excluir");

  await getPool().query(
    `
      update lancamentos
      set ativo = false,
        updated_at = now()
      where id = $1
    `,
    [id]
  );

  revalidatePath("/");
  revalidatePath("/admin/lancamentos");
  redirect("/admin/lancamentos?ok=excluido");
}
