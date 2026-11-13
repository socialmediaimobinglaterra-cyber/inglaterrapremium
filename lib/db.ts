import { postgresConfig } from "./postgres-config";
import "dotenv/config";
import { Pool } from "pg";

let pool: Pool | null = null;

function createPool(connectionString: string) {
  return new Pool(postgresConfig(connectionString));
}

export function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada.");
  }

  if (!pool) {
    pool = createPool(connectionString);
  }

  return pool;
}
