"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { ensureInstagramPostsTable } from "@/lib/admin/instagram-schema";
import { getPool } from "@/lib/db";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PUBLISHED_POSTS = 4;

export type InstagramPostActionState = {
  error?: string;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function requireEditor() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

function normalizeInstagramUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Cole uma URL válida do Instagram.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname !== "instagram.com") {
    throw new Error("A URL precisa ser do Instagram.");
  }

  const match = url.pathname.match(/^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) {
    throw new Error("Use uma URL de post ou reel no formato /p/codigo/ ou /reel/codigo/.");
  }

  return `https://www.instagram.com/${match[1]}/${match[2]}/`;
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

async function uploadInstagramImage(file: FormDataEntryValue | null, url: string, required = true) {
  if (!(file instanceof File) || file.size === 0) {
    if (required) throw new Error("Envie uma imagem própria para este post.");
    return null;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não está disponível no ambiente de produção usado por este deploy."
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo do post precisa ser uma imagem.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `A imagem "${file.name}" excedeu o tamanho limite de ${Math.round(
        MAX_IMAGE_SIZE / (1024 * 1024)
      )} MB.`
    );
  }

  const shortcode = url.split("/").filter(Boolean).pop() ?? "post";
  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagem";
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? "";

  try {
    const blob = await put(`instagram/${shortcode}/${safeName}${extension}`, file, {
      access: "private",
      addRandomSuffix: true,
      token,
    });

    return publicBlobImageUrl(blob.url);
  } catch (error) {
    console.error("Falha no upload da imagem do Instagram para Vercel Blob", error);
    throw new Error(
      `Não foi possível enviar a imagem para o Vercel Blob. Confira o BLOB_READ_WRITE_TOKEN no projeto de produção correto.${blobErrorMessage(error)}`
    );
  }
}

function errorState(error: unknown): InstagramPostActionState {
  if (error instanceof Error && error.message) return { error: error.message };
  return { error: "Não foi possível salvar o post do Instagram agora." };
}

export async function addInstagramPostAction(
  _previousState: InstagramPostActionState,
  formData: FormData
): Promise<InstagramPostActionState> {
  await requireEditor();

  try {
    const url = normalizeInstagramUrl(stringValue(formData, "url") ?? "");
    const imagem = await uploadInstagramImage(formData.get("imagem"), url, true);
    const legenda = stringValue(formData, "legenda");
    const pool = getPool();
    await ensureInstagramPostsTable(pool);

    const activeCountResult = await pool.query(`
      select count(*)::int as total
      from instagram_posts
      where ativo = true
    `);

    if (Number(activeCountResult.rows[0]?.total ?? 0) >= MAX_PUBLISHED_POSTS) {
      throw new Error(
        `A Home pode publicar no máximo ${MAX_PUBLISHED_POSTS} posts do Instagram. Desative um post antes de adicionar outro.`
      );
    }

    const orderResult = await pool.query(`
      select coalesce(max(ordem), 0) + 1 as next_order
      from instagram_posts
    `);

    await pool.query(
      `
        insert into instagram_posts (url, imagem, legenda, ordem, ativo)
        values ($1, $2, $3, $4, true)
      `,
      [url, imagem, legenda, orderResult.rows[0]?.next_order ?? 1]
    );

    revalidatePath("/");
    revalidatePath("/admin/instagram");
  } catch (error) {
    console.error("Erro ao adicionar post do Instagram", error);
    return errorState(error);
  }

  redirect("/admin/instagram?ok=adicionado");
}

export async function updateInstagramPostAction(
  _previousState: InstagramPostActionState,
  formData: FormData
): Promise<InstagramPostActionState> {
  await requireEditor();

  try {
    const id = stringValue(formData, "id");
    if (!id) throw new Error("Post não encontrado.");

    const url = normalizeInstagramUrl(stringValue(formData, "url") ?? "");
    const legenda = stringValue(formData, "legenda");
    const existingImage = stringValue(formData, "imagem_existente");
    const uploadedImage = await uploadInstagramImage(formData.get("imagem"), url, false);
    const imagem = uploadedImage ?? existingImage;

    if (!imagem) {
      throw new Error("Envie uma imagem própria para este post.");
    }

    const pool = getPool();
    await ensureInstagramPostsTable(pool);

    await pool.query(
      `
        update instagram_posts
        set url = $1,
          imagem = $2,
          legenda = $3
        where id = $4
      `,
      [url, imagem, legenda, id]
    );

    revalidatePath("/");
    revalidatePath("/admin/instagram");
  } catch (error) {
    console.error("Erro ao editar post do Instagram", error);
    return errorState(error);
  }

  redirect("/admin/instagram?ok=editado");
}

export async function toggleInstagramPostAction(formData: FormData) {
  await requireEditor();

  const id = stringValue(formData, "id");
  if (!id) redirect("/admin/instagram?erro=post");

  const pool = getPool();
  await ensureInstagramPostsTable(pool);

  const currentResult = await pool.query(
    `
      select ativo
      from instagram_posts
      where id = $1
      limit 1
    `,
    [id]
  );

  const current = currentResult.rows[0];
  if (!current) redirect("/admin/instagram?erro=post");

  if (!current.ativo) {
    const activeCountResult = await pool.query(`
      select count(*)::int as total
      from instagram_posts
      where ativo = true
    `);

    if (Number(activeCountResult.rows[0]?.total ?? 0) >= MAX_PUBLISHED_POSTS) {
      redirect("/admin/instagram?erro=limite");
    }
  }

  await pool.query(
    `
      update instagram_posts
      set ativo = not ativo
      where id = $1
    `,
    [id]
  );

  revalidatePath("/");
  revalidatePath("/admin/instagram");
  redirect("/admin/instagram?ok=status");
}

export async function deleteInstagramPostAction(formData: FormData) {
  await requireEditor();

  const id = stringValue(formData, "id");
  if (!id) redirect("/admin/instagram?erro=post");

  const pool = getPool();
  await ensureInstagramPostsTable(pool);
  await pool.query("delete from instagram_posts where id = $1", [id]);

  revalidatePath("/");
  revalidatePath("/admin/instagram");
  redirect("/admin/instagram?ok=removido");
}

export async function reorderInstagramPostsAction(ids: string[]) {
  await requireEditor();

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id.trim())) {
    return { ok: false };
  }

  const pool = getPool();
  await ensureInstagramPostsTable(pool);

  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const [index, id] of ids.entries()) {
      await client.query("update instagram_posts set ordem = $1 where id = $2", [
        index + 1,
        id,
      ]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    console.error("Erro ao reordenar posts do Instagram", error);
    return { ok: false };
  } finally {
    client.release();
  }

  revalidatePath("/");
  revalidatePath("/admin/instagram");
  return { ok: true };
}
