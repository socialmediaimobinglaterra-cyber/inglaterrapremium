"use server";

import { redirect } from "next/navigation";
import { requestLoginCode, verifyLoginCode } from "@/lib/admin/login-codes";
import { setAdminSessionCookie } from "@/lib/admin/session";

export async function requestCodeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    redirect("/admin/login?erro=email");
  }

  try {
    await requestLoginCode(email);
  } catch {
    redirect(`/admin/login?email=${encodeURIComponent(email)}&erro=envio`);
  }

  redirect(`/admin/login?email=${encodeURIComponent(email)}&sent=1`);
}

export async function verifyCodeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const user = await verifyLoginCode(email, code);

  if (!user) {
    redirect(`/admin/login?email=${encodeURIComponent(email)}&sent=1&erro=codigo`);
  }

  await setAdminSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  redirect(user.role === "admin" ? "/admin/usuarios" : "/admin");
}
