import { assertScriptWriteTarget } from "../lib/script-safety";
import fs from "node:fs/promises";
import path from "node:path";
import { getPool } from "@/lib/db";

async function main() {
  assertScriptWriteTarget();
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
  console.error("Operação recusada ou falhou. Verifique ambiente, confirmação explícita do destino e configuração; detalhes sensíveis omitidos.");
  process.exit(1);
});
