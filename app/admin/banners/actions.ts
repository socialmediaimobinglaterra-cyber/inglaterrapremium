"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { ensureBannerSchema } from "@/lib/admin/banners";
import { getPool } from "@/lib/db";
import { bannerLink } from "@/lib/home-banners";

export async function saveBannerAction(_previous: { error?: string; ok?: boolean }, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentAdminUser();
  if (!user || !["admin", "editor"].includes(user.role)) return { error: "Sua sessão expirou. Entre novamente no painel." };
  const id = String(form.get("id") || "");
  const operation = String(form.get("operation") || "save");
  if ((id && !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) || !["save", "delete"].includes(operation)) return { error: "Operação inválida." };
  let uploaded: string | undefined;
  let persisted = false;
  try {
    await ensureBannerSchema();
    if (operation === "delete") {
      if (!id) return { error: "Banner inválido." };
      await getPool().query("delete from home_banners where id=$1", [id]);
    } else {
      const alt = String(form.get("alt") || "").trim();
      const rawLink = String(form.get("link") || "").trim();
      const link = bannerLink(rawLink);
      const rawOrder = String(form.get("ordem") || "0");
      const ordem = Number(rawOrder);
      const ativo = form.get("ativo") === "on";
      if (!alt || alt.length > 500 || rawLink.length > 2000 || (rawLink && !link) || !/^\d+$/.test(rawOrder) || !Number.isSafeInteger(ordem) || ordem > 100000) return { error: "Confira a descrição (até 500 caracteres), o link HTTPS ou interno e a ordem." };
      const file = form.get("imagem");
      const hasFile = file instanceof File && file.size > 0;
      if (!id && !hasFile) return { error: "Selecione a imagem do banner." };
      let width: number | null = null;
      let height: number | null = null;
      if (hasFile) {
        if (file.size > 8 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "Use JPG, PNG ou WebP de até 8 MB." };
        if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "O armazenamento de imagens não está configurado." };
        const converted = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 })
          .rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
        width = converted.info.width; height = converted.info.height;
        const blob = await put(`home-banners/${randomUUID()}.webp`, converted.data, { access: "private", contentType: "image/webp", addRandomSuffix: true });
        uploaded = blob.url;
      }
      if (id) {
        const result = await getPool().query(`update home_banners set alt=$2,link=$3,ordem=$4,ativo=$5,
          imagem=coalesce($6,imagem),width=coalesce($7,width),height=coalesce($8,height) where id=$1`,
          [id, alt, link, ordem, ativo, uploaded ?? null, width, height]);
        if (!result.rowCount) throw new Error("banner_not_found");
      } else {
        await getPool().query("insert into home_banners(id,imagem,alt,link,width,height,ordem,ativo) values($1,$2,$3,$4,$5,$6,$7,$8)",
          [randomUUID(), uploaded, alt, link, width, height, ordem, ativo]);
      }
    }
    persisted = true;
    revalidateTag("home-banners");
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch {
    if (uploaded && !persisted) await del(uploaded).catch(() => undefined);
    return { error: "Não foi possível concluir. Confira a imagem e tente novamente." };
  }
}
