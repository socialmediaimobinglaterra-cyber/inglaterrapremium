import { getPool } from "@/lib/db";
import { DEFAULT_KENLO_XML_URL, syncKenlo } from "@/lib/kenlo-sync";

async function main() {
  const pool = getPool();
  const xmlUrl = process.env.KENLO_XML_URL ?? DEFAULT_KENLO_XML_URL;

  try {
    const result = await syncKenlo(pool, xmlUrl);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
