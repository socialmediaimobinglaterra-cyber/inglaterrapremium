import { isLocalCrmPreview } from "./crm-preview";

export function hasPreviewSessionSecret(env: NodeJS.ProcessEnv = process.env) {
  const secret = env.ADMIN_SESSION_SECRET?.trim() || env.KENLO_SYNC_SECRET?.trim();
  return Boolean(secret && secret !== "dev-admin-session-secret-change-me");
}

async function currentUser() {
  const { getCurrentAdminUser } = await import("./admin/auth");
  return getCurrentAdminUser();
}

export async function canAccessCrmPreview(request?: Request, readUser: () => Promise<{ role: string } | null> = currentUser) {
  if (isLocalCrmPreview()) return true;
  if (!hasPreviewSessionSecret()) return false;
  // Browser POSTs must originate on this site, even with an authenticated cookie.
  if (request && request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) return false;
  try {
    const user = await readUser();
    return user?.role === "admin";
  } catch {
    return false;
  }
}
