type Env = Record<string, string | undefined>;
export type RuntimeEnvironment = "production" | "preview" | "development" | "unknown";

export function runtimeEnvironment(env: Env = process.env): RuntimeEnvironment {
  if (env.VERCEL_ENV) {
    if (env.VERCEL_TARGET_ENV && env.VERCEL_TARGET_ENV !== env.VERCEL_ENV) return "unknown";
    return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development"
      ? env.VERCEL_ENV : "unknown";
  }
  if (!env.VERCEL && !env.VERCEL_TARGET_ENV && env.NODE_ENV === "development") return "development";
  return "unknown";
}

// No non-production override: sandbox integrations require a separate future change.
export function productionEffectsAllowed(env: Env = process.env) {
  return runtimeEnvironment(env) === "production";
}
export function requireProductionEffect(env: Env = process.env) {
  if (!productionEffectsAllowed(env)) throw new Error("Operação externa bloqueada neste ambiente.");
}
export function adminSessionSecret(env: Env = process.env) {
  const secret = env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret !== "dev-admin-session-secret-change-me" ? secret : null;
}

// Direct and pooled Neon hosts identify the same endpoint for the denylist.
export function endpointIdentity(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "").replace(/-pooler(?=\.)/, "");
}

export function databaseSafetyOptions(connectionString: string, env: Env = process.env) {
  if (runtimeEnvironment(env) === "production") return undefined;
  const environment = runtimeEnvironment(env);
  const expectedHost = environment === "preview" ? env.PREVIEW_DATABASE_HOST : environment === "development" ? env.LOCAL_DATABASE_HOST : undefined;
  let host: string;
  try {
    const url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      ["options", "host", "hostaddr", "port", "database"].some(key => url.searchParams.has(key))) throw new Error();
    host = url.hostname;
  } catch { throw new Error("Destino do banco inválido."); }
  if (!expectedHost || host !== expectedHost.trim()) throw new Error("Destino do banco não confirmado para este ambiente.");
  if (environment === "preview") {
    const productionHosts = env.PRODUCTION_DATABASE_HOSTS?.split(",").map(value => value.trim()).filter(Boolean);
    if (!productionHosts?.length || productionHosts.some(value => !/^[a-zA-Z0-9.-]+$/.test(value))) {
      throw new Error("Lista de endpoints de Production não confirmada.");
    }
    if (productionHosts.some(value => endpointIdentity(value) === endpointIdentity(host))) {
      throw new Error("Conexão com endpoint de Production recusada no Preview.");
    }
    const url = new URL(connectionString);
    const role = env.PREVIEW_DATABASE_ROLE?.trim();
    if (!role || decodeURIComponent(url.username) !== role || url.searchParams.has("user")) {
      throw new Error("Role exclusiva de Preview não confirmada.");
    }
  }
  // Preview remains read-only until a separately reviewed write-enablement change.
  return "-c default_transaction_read_only=on -c statement_timeout=10000 -c lock_timeout=2000";
}
