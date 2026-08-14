import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";
import { getAdminUserByEmail, normalizeAdminEmail } from "@/lib/admin/auth";

const CODE_TTL_MINUTES = 10;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

async function sendLoginCodeEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  const from =
    process.env.ADMIN_EMAIL_FROM ??
    "Inglaterra Premium <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Seu código de acesso ao Admin Inglaterra Premium",
      text: `Seu código de acesso é ${code}. Ele expira em ${CODE_TTL_MINUTES} minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #101a26;">
          <p>Seu código de acesso ao Admin Inglaterra Premium é:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${code}</p>
          <p>Ele expira em ${CODE_TTL_MINUTES} minutos.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail pelo Resend: ${body}`);
  }
}

export async function requestLoginCode(email: string) {
  const normalizedEmail = normalizeAdminEmail(email);
  const user = await getAdminUserByEmail(normalizedEmail);

  if (!user) {
    return { sent: false };
  }

  const code = generateCode();
  const pool = getPool();

  await pool.query(
    `
      update admin_login_codes
      set used_at = now()
      where email = $1 and used_at is null
    `,
    [normalizedEmail]
  );
  await pool.query(
    `
      insert into admin_login_codes (email, code, expires_at)
      values ($1, $2, now() + interval '10 minutes')
    `,
    [normalizedEmail, hashCode(code)]
  );

  await sendLoginCodeEmail(normalizedEmail, code);

  return { sent: true };
}

export async function verifyLoginCode(email: string, code: string) {
  const normalizedEmail = normalizeAdminEmail(email);
  const cleanCode = code.trim();
  const user = await getAdminUserByEmail(normalizedEmail);

  if (!user || !/^\d{6}$/.test(cleanCode)) return null;

  const pool = getPool();
  const result = await pool.query(
    `
      select ctid, code
      from admin_login_codes
      where email = $1
        and used_at is null
        and expires_at > now()
      order by expires_at desc
      limit 1
    `,
    [normalizedEmail]
  );

  const row = result.rows[0];
  if (!row || !safeCompare(row.code, hashCode(cleanCode))) {
    return null;
  }

  await pool.query(
    `
      update admin_login_codes
      set used_at = now()
      where ctid = $1::tid
    `,
    [row.ctid]
  );

  return user;
}
