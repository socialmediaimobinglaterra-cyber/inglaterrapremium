"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { ensureInstagramPostsTable } from "@/lib/admin/instagram-schema";
import { getPool } from "@/lib/db";

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
    const pool = getPool();
    await ensureInstagramPostsTable(pool);

    const orderResult = await pool.query(`
      select coalesce(max(ordem), 0) + 1 as next_order
      from instagram_posts
    `);

    await pool.query(
      `
        insert into instagram_posts (url, ordem, ativo)
        values ($1, $2, true)
      `,
      [url, orderResult.rows[0]?.next_order ?? 1]
    );

    revalidatePath("/");
    revalidatePath("/admin/instagram");
  } catch (error) {
    console.error("Erro ao adicionar post do Instagram", error);
    return errorState(error);
  }

  redirect("/admin/instagram?ok=adicionado");
}

export async function toggleInstagramPostAction(formData: FormData) {
  await requireEditor();

  const id = stringValue(formData, "id");
  if (!id) redirect("/admin/instagram?erro=post");

  const pool = getPool();
  await ensureInstagramPostsTable(pool);
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
