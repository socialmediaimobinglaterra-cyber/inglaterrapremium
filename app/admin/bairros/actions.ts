"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export type SaveBairroState = {
  error?: string;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function publicBlobImageUrl(blobUrl: string) {
  return `/api/blob-image?url=${encodeURIComponent(blobUrl)}`;
}

function blobErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) return "";

  return ` Detalhe do Blob: ${error.message.replace(
    /vercel_blob_rw_[A-Za-z0-9_-]+/g,
    "[token oculto]"
  )}`;
}

async function requireEditor() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

async function uploadCover(file: FormDataEntryValue | null, bairroNome: string) {
  if (!(file instanceof File) || file.size === 0) return null;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não está disponível no ambiente de produção usado por este deploy."
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo da capa precisa ser uma imagem.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("A imagem de capa deve ter no máximo 4 MB.");
  }

  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "capa";
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";

  try {
    const blob = await put(`bairros/${slugify(bairroNome)}/${safeName}${extension}`, file, {
      access: "private",
      addRandomSuffix: true,
      token,
    });

    return publicBlobImageUrl(blob.url);
  } catch (error) {
    console.error("Falha no upload da imagem de capa do bairro", error);
    throw new Error(
      `Não foi possível enviar a imagem para o Vercel Blob. Confira o BLOB_READ_WRITE_TOKEN no projeto de produção correto.${blobErrorMessage(error)}`
    );
  }
}

function parseFaq(formData: FormData) {
  const perguntas = formData.getAll("faq_pergunta");
  const respostas = formData.getAll("faq_resposta");

  return perguntas
    .map((pergunta, index) => ({
      pergunta: typeof pergunta === "string" ? pergunta.trim() : "",
      resposta: typeof respostas[index] === "string" ? String(respostas[index]).trim() : "",
    }))
    .filter((item) => item.pergunta && item.resposta);
}

function errorState(error: unknown): SaveBairroState {
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }

  return { error: "Não foi possível salvar o bairro agora. Confira os campos e tente novamente." };
}

export async function saveBairroAction(
  _previousState: SaveBairroState,
  formData: FormData
): Promise<SaveBairroState> {
  await requireEditor();

  const id = stringValue(formData, "id");
  if (!id) return { error: "Selecione um bairro para editar." };

  const pool = getPool();

  try {
    const currentResult = await pool.query(
      `
        select nome, slug
        from bairros
        where id = $1 and ativo = true
        limit 1
      `,
      [id]
    );

    const current = currentResult.rows[0];
    if (!current) return { error: "Bairro não encontrado." };

    const existingCover = stringValue(formData, "imagem_capa_existente");
    const uploadedCover = await uploadCover(formData.get("imagem_capa"), current.nome);
    const imagemCapa = uploadedCover ?? existingCover;
    const descricao = stringValue(formData, "descricao");
    const faq = parseFaq(formData);

    await pool.query(
      `
        update bairros
        set imagem_capa = $1,
          descricao = $2,
          faq = $3::jsonb,
          updated_at = now()
        where id = $4
      `,
      [imagemCapa, descricao, JSON.stringify(faq), id]
    );

    revalidatePath("/");
    revalidatePath(`/bairros/${current.slug}`);
    revalidatePath("/bairros/[slug]", "page");
    revalidatePath("/admin/bairros");
  } catch (error) {
    console.error("Erro ao salvar bairro", error);
    return errorState(error);
  }

  redirect(`/admin/bairros?editar=${id}&ok=1`);
}
