import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { bannerLink } from "../lib/home-banners";

function harness(role: string | null = "editor", fail = false) {
  const queries: { sql: string; params: unknown[] }[] = [];
  const invalidated: string[] = [];
  const uploads: unknown[] = [];
  const deleted: string[] = [];
  const mod = { exports: {} as any };
  const transform = { rotate() { return this; }, resize() { return this; }, webp() { return this; }, async toBuffer() { return { data: Buffer.from("webp"), info: { width: 1600, height: 600 } }; } };
  vm.runInNewContext(ts.transpileModule(readFileSync("app/admin/banners/actions.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    module: mod, exports: mod.exports, File, Buffer, process: { env: { BLOB_READ_WRITE_TOKEN: "fixture" } }, require(name: string) {
      if (name.endsWith("/runtime-policy")) return { productionEffectsAllowed: () => true, requireProductionEffect: () => {} };
      if (name === "node:crypto") return { randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
      if (name === "sharp") return () => transform;
      if (name === "@vercel/blob") return { put: async (...args: unknown[]) => { uploads.push(args); return { url: "https://fixture.private.blob.vercel-storage.com/home-banners/test.webp" }; }, del: async (url: string) => deleted.push(url) };
      if (name === "next/cache") return { revalidatePath: (path: string) => invalidated.push(path), revalidateTag: (tag: string) => invalidated.push(tag) };
      if (name === "@/lib/admin/auth") return { getCurrentAdminUser: async () => role ? { role } : null };
      if (name === "@/lib/admin/banners") return { ensureBannerSchema: async () => {} };
      if (name === "@/lib/db") return { getPool: () => ({ query: async (sql: string, params: unknown[]) => { if (fail) throw new Error("db"); queries.push({ sql, params }); return { rowCount: 1 }; } }) };
      if (name === "@/lib/home-banners") return { bannerLink };
      throw new Error(name);
    },
  });
  return { queries, invalidated, uploads, deleted, run: (form: FormData) => mod.exports.saveBannerAction({}, form) };
}
function form(id = "") {
  const data = new FormData(); data.set("id", id); data.set("alt", "Campanha"); data.set("ordem", "2"); data.set("link", "/contato");
  return data;
}
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("anonymous and unauthorized roles cannot mutate banners or upload", async () => {
  for (const role of [null, "visitor"]) {
    const h = harness(role); assert((await h.run(form())).error); assert.equal(h.queries.length + h.uploads.length, 0);
  }
});
test("banner create uploads privately and invalidates Home; edit preserves image and updates status/order", async () => {
  const h = harness(); const data = form(); data.set("imagem", new File(["image"], "test.png", { type: "image/png" })); data.set("ativo", "on");
  assert((await h.run(data)).ok); assert.equal(h.uploads.length, 1);
  assert.equal((h.uploads[0] as any[])[2].access, "private");
  assert.equal(h.queries[0].params[7], true); assert(h.invalidated.includes("home-banners"));
  assert((await h.run(form(id))).ok); assert.equal(h.uploads.length, 1);
  assert.deepEqual(Array.from(h.queries[1].params).slice(3), [2, false, null, null, null]);
});
test("invalid links, missing image and SVG are rejected; delete is parameterized", async () => {
  const h = harness(); const invalid = form(id); invalid.set("link", "javascript:alert(1)");
  assert((await h.run(invalid)).error); assert((await h.run(form())).error);
  const svg = form(); svg.set("imagem", new File(["svg"], "test.svg", { type: "image/svg+xml" })); assert((await h.run(svg)).error);
  assert.equal(h.queries.length + h.uploads.length, 0);
  const remove = form(id); remove.set("operation", "delete"); assert((await h.run(remove)).ok);
  assert(h.queries[0].sql.includes("where id=$1")); assert.equal(h.queries[0].params[0], id);
});
test("failed database write cleans up newly uploaded banner", async () => {
  const h = harness("admin", true); const data = form(); data.set("imagem", new File(["image"], "test.png", { type: "image/png" }));
  assert((await h.run(data)).error); assert.equal(h.deleted.length, 1); assert.equal(h.invalidated.length, 0);
});
