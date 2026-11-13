import { runtimeEnvironment } from "./runtime-policy";

// No connection is opened here. Never include the URL/password in an error.
export function assertScriptWriteTarget(args = process.argv.slice(2), env: Record<string, string | undefined> = process.env) {
  const environment = runtimeEnvironment(env);
  if (environment !== "production") throw new Error("Scripts de escrita bloqueados fora de Production nesta etapa.");
  let url: URL;
  try { url = new URL(env.DATABASE_URL ?? ""); } catch { throw new Error("Destino do banco inválido."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error("Destino do banco inválido.");
  if (["host", "hostaddr", "port", "database", "options"].some(key => url.searchParams.has(key))) throw new Error("Parâmetros de destino ambíguos recusados.");
  const target = `${url.host}${url.pathname}`;
  if (!args.includes("--confirm-environment=production") || !args.includes(`--confirm-database=${target}`)) {
    throw new Error("Confirme explicitamente ambiente e destino com --confirm-environment e --confirm-database=HOST/DATABASE. Nenhuma escrita executada.");
  }
}
