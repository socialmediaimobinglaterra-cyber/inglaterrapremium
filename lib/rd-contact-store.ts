import { requireProductionEffect } from "./runtime-policy";
import { createHmac } from "node:crypto";
import { getPool } from "./db";
import { sendLead } from "./saved-search-delivery";
type Submission = { fingerprint: string; consentVersion: string; consent: string; payload: unknown };

let ready: Promise<unknown> | undefined;
function ensureSchema() {
  requireProductionEffect();
  if (!ready) ready = getPool().query(`
    create table if not exists rd_contact_delivery (
      fingerprint text primary key, state text not null default 'pending',
      consent_version text not null, consent_text text not null,
      consent_at timestamptz not null default now(), expires_at timestamptz not null
    );
    create table if not exists rd_contact_quota (
      key text primary key, attempts int not null, expires_at timestamptz not null
    );
  `).catch(error => { ready = undefined; throw error; });
  return ready;
}

export async function deliverRdContact(request: Request, submission: Submission, apiKey: string) {
  await ensureSchema();
  const hash = (value: string) => createHmac("sha256", apiKey).update(value).digest("hex");
  const fingerprint = hash(submission.fingerprint);
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const client = await getPool().connect();
  let locked = false;
  try {
    for (const bucket of [{ key: `ip:${hash(ip)}`, limit: 10, seconds: 600 }, { key: "global", limit: 200, seconds: 3600 }]) {
      const { rows: [quota] } = await client.query(`insert into rd_contact_quota(key,attempts,expires_at)
        values($1,1,now()+$2*interval '1 second') on conflict(key) do update set
        attempts=case when rd_contact_quota.expires_at<=now() then 1 else rd_contact_quota.attempts+1 end,
        expires_at=case when rd_contact_quota.expires_at<=now() then excluded.expires_at else rd_contact_quota.expires_at end
        returning attempts, greatest(1,ceil(extract(epoch from expires_at-now()))) as retry`, [bucket.key, bucket.seconds]);
      if (quota.attempts > bucket.limit) return { status: 429, retry: Number(quota.retry), message: "Aguarde alguns minutos antes de tentar novamente." };
    }
    const { rows: [lock] } = await client.query("select pg_try_advisory_lock(hashtextextended($1,0)) as acquired", [`rd-contact:${fingerprint}`]);
    locked = lock.acquired;
    if (!locked) return { status: 409, message: "Cadastro em processamento. Aguarde antes de tentar novamente." };
    await client.query(`insert into rd_contact_delivery(fingerprint,consent_version,consent_text,expires_at)
      values($1,$2,$3,now()+interval '24 hours') on conflict(fingerprint) do update set
      state='pending', consent_at=now(), expires_at=excluded.expires_at
      where rd_contact_delivery.expires_at<=now()`, [fingerprint, submission.consentVersion, submission.consent]);
    const { rows: [record] } = await client.query("select state from rd_contact_delivery where fingerprint=$1", [fingerprint]);
    let state: string = record.state;
    if (state !== "sent" && state !== "uncertain") {
      // Mark before dispatch: interruptions must not cause an automatic duplicate conversion.
      await client.query("update rd_contact_delivery set state='uncertain' where fingerprint=$1", [fingerprint]);
      state = await sendLead("rd", submission.payload, { rd: apiKey, central: "" });
      await client.query("update rd_contact_delivery set state=$2 where fingerprint=$1", [fingerprint, state]);
      console.info("rd_contact_delivery", { state, consentVersion: submission.consentVersion });
    }
    await client.query("delete from rd_contact_quota where expires_at<now()-interval '1 day'");
    await client.query("delete from rd_contact_delivery where expires_at<now()-interval '30 days'");
    if (state === "sent") return { status: 200, message: "Cadastro realizado com sucesso." };
    if (state === "uncertain") return { status: 202, message: "Não foi possível confirmar o cadastro. Aguarde a verificação antes de reenviar." };
    return { status: 502, message: "Não foi possível cadastrar seu e-mail agora. Tente novamente mais tarde." };
  } finally {
    let destroyed = false;
    if (locked) {
      try { await client.query("select pg_advisory_unlock(hashtextextended($1,0))", [`rd-contact:${fingerprint}`]); }
      catch { client.release(true); destroyed = true; }
    }
    if (!destroyed) client.release();
  }
}
