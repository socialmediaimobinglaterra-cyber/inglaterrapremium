import "server-only";
import { getPool } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";

export type AdminRole = "admin" | "editor";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  invitedBy: string | null;
  createdAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapAdminUser(row: Record<string, any>): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

export function normalizeAdminEmail(email: string) {
  return normalizeEmail(email);
}

export async function getAdminUserByEmail(email: string) {
  const result = await getPool().query(
    `
      select id, email, role, invited_by, created_at
      from admin_users
      where email = $1
      limit 1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
}

export async function getAdminUserById(id: string) {
  const result = await getPool().query(
    `
      select id, email, role, invited_by, created_at
      from admin_users
      where id = $1
      limit 1
    `,
    [id]
  );

  return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
}

export async function getCurrentAdminUser() {
  const session = await getAdminSession();
  if (!session) return null;

  const user = await getAdminUserById(session.userId);
  if (!user || user.email !== session.email || user.role !== session.role) {
    return null;
  }

  return user;
}

export async function listAdminUsers() {
  const result = await getPool().query(
    `
      select u.id, u.email, u.role, u.invited_by, u.created_at,
        inviter.email as invited_by_email
      from admin_users u
      left join admin_users inviter on inviter.id = u.invited_by
      order by u.created_at asc
    `
  );

  return result.rows.map((row) => ({
    ...mapAdminUser(row),
    invitedByEmail: row.invited_by_email as string | null,
  }));
}

export async function inviteAdminUser({
  email,
  role,
  invitedBy,
}: {
  email: string;
  role: AdminRole;
  invitedBy: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const result = await getPool().query(
    `
      insert into admin_users (email, role, invited_by)
      values ($1, $2, $3)
      on conflict (email) do update set role = excluded.role
      returning id, email, role, invited_by, created_at
    `,
    [normalizedEmail, role, invitedBy]
  );

  return mapAdminUser(result.rows[0]);
}
