import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as blog from "../lib/blog-posts";

const row = { titulo: "Notícia real", resumo: "Resumo", capa: `https://${blog.BLOG_IMAGE_HOST}/storage/v1/object/public/post-images/covers/test.png`, categoria: null, data: "2026-07-01T12:00:00Z", link: `${blog.BLOG_URL}noticia` };
test("blog selects three most recent unique published posts, excluding future dates and unsafe links", () => {
  const rows = [row, row, { ...row, link: "javascript:alert(1)" }, { ...row, link: "https://other.test/post" }, { ...row, data: "2099-01-01", link: `${blog.BLOG_URL}future` },
    ...[2,3,4].map(day => ({ ...row, data: `2026-07-0${day}T12:00:00Z`, link: `${blog.BLOG_URL}post-${day}` }))];
  const posts = blog.parseBlogPosts({ posts: rows }, Date.parse("2026-11-06"));
  assert.equal(posts.length, 3); assert.equal(posts[0].href, `${blog.BLOG_URL}post-4`);
  assert.equal(posts[0].category, null); assert.equal(posts[0].image, row.capa);
});
test("blog missing images do not become unrelated stock photos; malformed responses fail safely", () => {
  const posts = blog.parseBlogPosts({ posts: [{ ...row, capa: "http://localhost/private" }] });
  assert.equal(posts[0].image, null);
  assert.deepEqual(blog.parseBlogPosts({ posts: [] }), []);
  for (const data of [null, {}, { posts: "invalid" }]) assert.throws(() => blog.parseBlogPosts(data));
  assert.equal(blog.parseBlogPosts({ posts: [{ ...row, data: "invalid" }, { ...row, titulo: null }] }).length, 0);
});
test("blog query uses small public GET, bounded timeout and cache; failures do not crash Home", async () => {
  let fail = false; let invalid = false; let settings: any;
  const mod = { exports: {} as any };
  vm.runInNewContext(ts.transpileModule(readFileSync("lib/queries/blog-posts.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: mod, exports: mod.exports, AbortSignal, console: { warn() {} },
    fetch: async (url: string, options: any) => {
      assert.equal(url, blog.BLOG_POSTS_URL); assert.equal(options.redirect, "error"); assert(options.signal);
      assert.equal(options.headers.Authorization, undefined);
      if (fail) throw new Error("timeout");
      return { ok: true, json: async () => invalid ? {} : { posts: [row] } };
    },
    require(name: string) {
      if (name === "@/lib/blog-posts") return blog;
      if (name === "next/cache") return { unstable_cache: (fn: unknown, _key: unknown, options: unknown) => { settings = options; return fn; } };
      throw new Error(name);
    },
  });
  assert.equal(settings.revalidate, 900); assert.equal((await mod.exports.getBlogPosts()).length, 1);
  fail = true; assert.equal((await mod.exports.getBlogPosts()).length, 0);
  fail = false; invalid = true; assert.equal((await mod.exports.getBlogPosts()).length, 0);
});
