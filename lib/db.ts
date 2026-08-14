import "dotenv/config";
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return pool;
}
