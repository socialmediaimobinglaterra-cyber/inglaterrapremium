export function isLocalCrmPreview(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "development" && !env.VERCEL && !env.VERCEL_ENV;
}

// Format decimal text without rounding through binary floating point.
export function formatCrmDecimal(value: string, minimumFractionDigits = 0) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw new Error("INVALID_DECIMAL");
  const [whole, fraction = ""] = value.split(".");
  const digits = fraction.replace(/0+$/, "").padEnd(minimumFractionDigits, "0");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (digits ? `,${digits}` : "");
}
