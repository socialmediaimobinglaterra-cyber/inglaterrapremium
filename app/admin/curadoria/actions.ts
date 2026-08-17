"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";

function parseOverride(value: FormDataEntryValue | null) {
  if (value === "include") return true;
  if (value === "exclude") return false;
  return null;
}

export async function updateCuradoriaAction(formData: FormData) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const inclusaoManual = parseOverride(formData.get("override"));

  if (!id) redirect("/admin/curadoria?erro=1");

  await getPool().query(
    `
      update imoveis
      set inclusao_manual = $2,
        updated_at = now()
      where id = $1
        and origem = 'kenlo'
    `,
    [id, inclusaoManual]
  );

  revalidatePath("/");
  revalidatePath("/imoveis");
  revalidatePath("/admin/curadoria");
  redirect("/admin/curadoria?ok=1");
}
