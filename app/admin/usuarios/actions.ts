"use server";

import { redirect } from "next/navigation";
import {
  getCurrentAdminUser,
  inviteAdminUser,
  type AdminRole,
} from "@/lib/admin/auth";

export async function inviteUserAction(formData: FormData) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as AdminRole;

  if (!email || (role !== "admin" && role !== "editor")) {
    redirect("/admin/usuarios?erro=convite");
  }

  await inviteAdminUser({
    email,
    role,
    invitedBy: currentUser.id,
  });

  redirect("/admin/usuarios?ok=convite");
}
