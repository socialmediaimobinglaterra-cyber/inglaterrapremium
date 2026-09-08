"use client";

import Script from "next/script";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  addInstagramPostAction,
  deleteInstagramPostAction,
  reorderInstagramPostsAction,
  toggleInstagramPostAction,
} from "@/app/admin/instagram/actions";
import type { InstagramPost } from "@/lib/queries/instagram-posts";

function processInstagramEmbeds() {
  const instagram = (window as Window & { instgrm?: { Embeds?: { process: () => void } } })
    .instgrm;
  instagram?.Embeds?.process();
}

function InstagramEmbedPreview({ url }: { url: string }) {
  useEffect(() => {
    processInstagramEmbeds();
  }, [url]);

  return (
    <div className="overflow-hidden border border-navy/10 bg-offwhite p-2">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: "#fff",
          border: 0,
          margin: "0 auto",
          maxWidth: 540,
          minWidth: 260,
          width: "100%",
        }}
      >
        <a href={url} rel="noreferrer" target="_blank">
          Ver post no Instagram
        </a>
      </blockquote>
    </div>
  );
}

export function InstagramPostsManager({ posts }: { posts: InstagramPost[] }) {
  const [formState, formAction, pending] = useActionState(addInstagramPostAction, {});
  const [items, setItems] = useState(posts);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(posts);
  }, [posts]);

  useEffect(() => {
    processInstagramEmbeds();
  }, [items]);

  function persistOrder(nextItems: InstagramPost[]) {
    startTransition(async () => {
      await reorderInstagramPostsAction(nextItems.map((item) => item.id));
    });
  }

  function moveItem(fromId: string, toId: string) {
    if (fromId === toId) return;

    const fromIndex = items.findIndex((item) => item.id === fromId);
    const toIndex = items.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextItems = [...items];
    const [removed] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, removed);
    setItems(nextItems);
    persistOrder(nextItems);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr]">
      <Script
        async
        onLoad={processInstagramEmbeds}
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
      />

      <section className="border border-navy/10 bg-white p-5 md:p-6">
        <h2 className="mb-2 text-sm font-semibold">Adicionar post</h2>
        <p className="mb-5 text-sm leading-relaxed text-sand">
          Cole a URL pública de um post ou reel do Instagram.
        </p>

        <form action={formAction} className="space-y-4">
          {formState.error ? (
            <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
              {formState.error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-sand">
              URL do post
            </span>
            <input
              className="w-full border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-terra"
              name="url"
              placeholder="https://www.instagram.com/p/ABC123/"
              required
              type="url"
            />
          </label>
          <button
            className="bg-terra px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      </section>

      <section className="border border-navy/10 bg-white">
        <div className="border-b border-navy/10 p-5 md:p-6">
          <h2 className="text-sm font-semibold">Posts cadastrados</h2>
          <p className="mt-1 text-sm leading-relaxed text-sand">
            Arraste para reordenar. Posts inativos ficam no admin, mas não aparecem na Home.
          </p>
          {isPending ? (
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-terra">
              Salvando ordem...
            </p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-navy/10">
            {items.map((post, index) => (
              <article
                className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_260px] md:p-6"
                draggable
                key={post.id}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedId(post.id)}
                onDrop={() => {
                  if (draggedId) moveItem(draggedId, post.id);
                  setDraggedId(null);
                }}
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="border border-navy/10 bg-offwhite px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-navy">
                      #{index + 1}
                    </span>
                    <span
                      className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                        post.ativo
                          ? "border-emerald-700/10 bg-emerald-50 text-emerald-900"
                          : "border-navy/10 bg-offwhite text-sand"
                      }`}
                    >
                      {post.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <a
                    className="break-all text-sm leading-relaxed text-navy underline-offset-4 hover:text-terra hover:underline"
                    href={post.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {post.url}
                  </a>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={toggleInstagramPostAction}>
                      <input name="id" type="hidden" value={post.id} />
                      <button
                        className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                        type="submit"
                      >
                        {post.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                    <form action={deleteInstagramPostAction}>
                      <input name="id" type="hidden" value={post.id} />
                      <button
                        className="border border-terra/25 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-terra hover:bg-terra hover:text-white"
                        type="submit"
                      >
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
                <InstagramEmbedPreview url={post.url} />
              </article>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm leading-relaxed text-sand md:p-6">
            Nenhum post cadastrado ainda. A seção do Instagram não aparece na Home enquanto não houver posts ativos.
          </p>
        )}
      </section>
    </div>
  );
}
