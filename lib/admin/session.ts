import "server-only";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "inglaterra_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AdminSession = {
  userId: string;
  email: string;
  role: "admin" | "editor";
  exp: number;
};

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.KENLO_SYNC_SECRET ??
    "dev-admin-session-secret-change-me"
  );
}

function base64UrlEncode(value: Uint8Array | string) {
  const text =
    typeof value === "string"
      ? value
      : String.fromCharCode(...Array.from(value));

  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return atob(padded);
}

async function signPayload(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return base64UrlEncode(new Uint8Array(signature));
}

export async function createAdminSessionToken(session: Omit<AdminSession, "exp">) {
  const payload = base64UrlEncode(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  );
  const signature = await signPayload(payload);

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await signPayload(payload);
  if (signature !== expected) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as AdminSession;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (parsed.role !== "admin" && parsed.role !== "editor") return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(session: Omit<AdminSession, "exp">) {
  const token = await createAdminSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();

  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
