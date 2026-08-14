import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { DEFAULT_KENLO_XML_URL, syncKenlo } from "@/lib/kenlo-sync";

async function handleSync(request: Request) {
  const expectedSecret = process.env.KENLO_SYNC_SECRET ?? process.env.CRON_SECRET;
  const providedSecret = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const pool = getPool();
  const result = await syncKenlo(
    pool,
    process.env.KENLO_XML_URL ?? DEFAULT_KENLO_XML_URL
  );

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}
