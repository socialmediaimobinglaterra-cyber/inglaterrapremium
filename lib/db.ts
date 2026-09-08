import "dotenv/config";
import { Pool } from "pg";

let pool: Pool | null = null;

function createPool(connectionString: string) {
  let sanitizedConnectionString = connectionString;
  let ssl: { rejectUnauthorized: false } | undefined;

  try {
    const databaseUrl = new URL(connectionString);
    const sslMode = databaseUrl.searchParams.get("sslmode");

    if (sslMode) {
      databaseUrl.searchParams.delete("sslmode");
      sanitizedConnectionString = databaseUrl.toString();
    }

    if (sslMode === "require" || sslMode === "verify-full") {
      ssl = { rejectUnauthorized: false };
    }
  } catch {
    if (connectionString.includes("sslmode=require")) {
      sanitizedConnectionString = connectionString.replace(
        /([?&])sslmode=require(&?)/,
        (_match, prefix: string, suffix: string) =>
          prefix === "?" && suffix ? "?" : suffix ? prefix : ""
      );
      ssl = { rejectUnauthorized: false };
    }
  }

  return new Pool({
    connectionString: sanitizedConnectionString,
    ssl,
  });
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
