import { NextRequest, NextResponse } from "next/server";
import { isLocalCrmPreview } from "@/lib/crm-preview";

const ADMIN_SESSION_COOKIE = "inglaterra_admin_session";

type AdminSession = {
  userId: string;
  email: string;
  role: "admin" | "editor";
  exp: number;
};

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.KENLO_SYNC_SECRET?.trim() ||
    "dev-admin-session-secret-change-me"
  );
}

function base64UrlEncode(value: Uint8Array) {
  const text = String.fromCharCode(...Array.from(value));

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

async function verifySession(token: string | undefined) {
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/preview/crm")) {
    const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
    if (!isLocalCrmPreview()) {
      const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.KENLO_SYNC_SECRET?.trim();
      if (!secret || secret === "dev-admin-session-secret-change-me") return new NextResponse(null, { status: 404, headers });
      const session = await verifySession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
      if (!session || session.role !== "admin") {
        if (pathname.startsWith("/preview/crm/api/")) return new NextResponse(null, { status: 404, headers });
        return NextResponse.redirect(new URL("/admin/login", request.url), { headers });
      }
    }
    const previewHeaders = new Headers(request.headers);
    previewHeaders.set("x-inglaterra-crm-preview", "1");
    return NextResponse.next({ request: { headers: previewHeaders }, headers });
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-inglaterra-admin-path", "1");

  if (pathname === "/admin/login") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const session = await verifySession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname.startsWith("/admin/usuarios") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/preview/crm/:path*"],
};
