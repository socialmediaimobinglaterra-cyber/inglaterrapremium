import fs from "node:fs/promises";
import path from "node:path";
import { getPool } from "@/lib/db";

async function main() {
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  const pool = getPool();

  try {
    await pool.query(schema);
    console.log("Schema Postgres aplicado com sucesso.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
