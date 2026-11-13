import { requireProductionEffect } from "./runtime-policy";
import { createHmac, randomUUID } from "node:crypto";
import { getPool } from "./db";
import { SEARCH_CONSENT_VERSION, type SavedSearchLead } from "./saved-search";
import { leadPayloads, sendLead, type DeliveryState, type Destination } from "./saved-search-delivery";

let ready: Promise<unknown> | undefined;
function ensureSchema() {
  requireProductionEffect();
  if (!ready) ready = getPool().query(`
    create table if not exists saved_search_delivery (
      fingerprint text primary key, reference uuid not null, consent_version text not null,
      created_at timestamptz not null default now(), expires_at timestamptz not null,
      central text not null default 'pending', rd text not null default 'pending'
    );
    create table if not exists saved_search_quota (
      key text primary key, attempts int not null, expires_at timestamptz not null
    );
  `).catch(error => { ready = undefined; throw error; });
  return ready;
}

export async function deliverSavedSearch(request: Request, lead: SavedSearchLead, secrets: { central: string; rd: string }) {
  await ensureSchema();
  const hash = (value: string) => createHmac("sha256", secrets.central).update(value).digest("hex");
  const fingerprint = hash(JSON.stringify([lead.email, lead.phone, lead.filters, SEARCH_CONSENT_VERSION]));
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const client = await getPool().connect();
  let locked = false;
  try {
    const quota = [
      { key: `ip:${hash(ip)}`, limit: 5, seconds: 600 },
      { key: `contact:${hash(lead.phone)}`, limit: 10, seconds: 86400 },
      { key: "global", limit: 100, seconds: 3600 },
    ];
    for (const bucket of quota) {
      const result = await client.query(`insert into saved_search_quota(key,attempts,expires_at)
        values($1,1,now()+$2*interval '1 second') on conflict(key) do update set
        attempts=case when saved_search_quota.expires_at<=now() then 1 else saved_search_quota.attempts+1 end,
        expires_at=case when saved_search_quota.expires_at<=now() then excluded.expires_at else saved_search_quota.expires_at end
        returning attempts, greatest(1,ceil(extract(epoch from expires_at-now()))) as retry`, [bucket.key, bucket.seconds]);
      if (result.rows[0].attempts > bucket.limit) return { status: 429, retry: Number(result.rows[0].retry), message: "Aguarde alguns minutos antes de tentar novamente." };
    }
    const lock = await client.query("select pg_try_advisory_lock(hashtextextended($1,0)) as acquired", [fingerprint]);
    locked = lock.rows[0].acquired;
    if (!locked) return { status: 409, message: "Sua solicitação está sendo processada. Aguarde e tente novamente." };
    await client.query(`insert into saved_search_delivery(fingerprint,reference,consent_version,expires_at)
      values($1,$2,$3,now()+interval '24 hours') on conflict(fingerprint) do update set
      reference=excluded.reference, consent_version=excluded.consent_version, created_at=now(),
      expires_at=excluded.expires_at, central='pending', rd='pending'
      where saved_search_delivery.expires_at<=now()`, [fingerprint, randomUUID(), SEARCH_CONSENT_VERSION]);
    const { rows: [record] } = await client.query("select * from saved_search_delivery where fingerprint=$1", [fingerprint]);
    const payloads = leadPayloads(lead, new Date(record.created_at).toISOString(), record.reference);
    for (const destination of ["central", "rd"] as Destination[]) {
      if (["sent", "uncertain", "rejected"].includes(record[destination])) continue;
      // Persist ambiguity BEFORE dispatch so an interrupted process cannot blindly resend.
      await client.query(`update saved_search_delivery set ${destination}='uncertain' where fingerprint=$1`, [fingerprint]);
      const state: DeliveryState = await sendLead(destination, payloads[destination], secrets);
      await client.query(`update saved_search_delivery set ${destination}=$2 where fingerprint=$1`, [fingerprint, state]);
      record[destination] = state;
      console.info("saved_search_delivery", { reference: record.reference, destination, state });
    }
    await client.query("delete from saved_search_quota where expires_at<now()-interval '1 day'");
    await client.query("delete from saved_search_delivery where expires_at<now()-interval '30 days'");
    if (record.central === "sent" && record.rd === "sent") return { status: 200, message: "Busca salva. Nossa equipe entrará em contato sobre o perfil que você procura.", reference: record.reference };
    if (record.central === "rejected" || record.rd === "rejected") return { status: 422, message: "Não foi possível concluir o registro da busca. Entre em contato com nossa equipe informando o protocolo abaixo.", reference: record.reference };
    if (record.central === "uncertain" || record.rd === "uncertain") return { status: 202, message: "Sua solicitação foi enviada, mas a confirmação está pendente. Não envie novamente. Consulte nossa equipe informando o protocolo abaixo.", reference: record.reference };
    return { status: 502, message: "Não foi possível concluir o envio aos dois sistemas. Tente novamente; o destino já confirmado não será reenviado.", reference: record.reference };
  } finally {
    let destroyed = false;
    if (locked) {
      try { await client.query("select pg_advisory_unlock(hashtextextended($1,0))", [fingerprint]); }
      catch { client.release(true); destroyed = true; }
    }
    if (!destroyed) client.release();
  }
}
