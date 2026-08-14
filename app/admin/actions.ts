"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "@/lib/admin/session";

export async function logoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
