import type { PoolConfig } from "pg";
import { databaseSafetyOptions } from "./runtime-policy";

// Pure configuration: no file reads, socket, credential logging or driver URL parser.
export function postgresConfig(connectionString: string, env: Record<string, string | undefined> = process.env): PoolConfig & { enableChannelBinding: boolean } {
  let url: URL;
  try {
    url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
    if (["host", "hostaddr", "port", "database", "user", "password", "sslcert", "sslkey", "sslrootcert"].some(key => url.searchParams.has(key))) throw new Error();
    const mode = url.searchParams.get("sslmode");
    if (mode && !["require", "verify-full", "verify-ca", "prefer"].includes(mode)) throw new Error();
    if (url.searchParams.has("ssl") && !["true", "1"].includes(url.searchParams.get("ssl")!)) throw new Error();
    // Parse here so invalid escapes never leak a connection URL through driver errors.
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error("Configuração PostgreSQL inválida ou TLS inseguro. Detalhes omitidos.");
  }
  const safety = databaseSafetyOptions(connectionString, env);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    // Public CA trust and the standard TLS hostname check; no permissive fallback.
    ssl: { rejectUnauthorized: true, servername: url.hostname },
    enableChannelBinding: url.searchParams.get("channel_binding") === "require",
    application_name: url.searchParams.get("application_name") ?? undefined,
    options: safety ?? url.searchParams.get("options") ?? undefined,
  };
}
