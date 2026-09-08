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

function DragHandle() {
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-5 grid-cols-2 place-content-center gap-1 text-navy/45"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <span className="h-1 w-1 rounded-full bg-current" key={index} />
      ))}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="4" stroke="currentColor" strokeWidth="1.7" width="16" x="4" y="4" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.8" cy="7.2" fill="currentColor" r="1" />
    </svg>
  );
}

function InstagramThumbnail({ url }: { url: string }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const endpoint = new URL("https://www.instagram.com/oembed/");
    endpoint.searchParams.set("url", url);

    setThumbnailUrl(null);
    setFailed(false);

    fetch(endpoint.toString())
      .then((response) => {
        if (!response.ok) throw new Error("Instagram oEmbed indisponivel");
        return response.json() as Promise<{ thumbnail_url?: string }>;
      })
      .then((data) => {
        if (!active) return;
        if (data.thumbnail_url) {
          setThumbnailUrl(data.thumbnail_url);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [url]);

  if (thumbnailUrl && !failed) {
    return (
      <img
        alt=""
        className="h-[72px] w-[72px] shrink-0 bg-navy object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
        src={thumbnailUrl}
      />
    );
  }

  return (
    <div className="grid h-[72px] w-[72px] shrink-0 place-items-center bg-navy text-offwhite">
      <InstagramMark />
    </div>
  );
}

function InstagramEmbedPreview({ url }: { url: string }) {
  useEffect(() => {
    processInstagramEmbeds();
  }, [url]);

  return (
    <div className="max-h-[78vh] overflow-auto border border-navy/10 bg-offwhite p-2">
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(posts);
  }, [posts]);

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
    <div className="space-y-5">
      <Script
        async
        onLoad={processInstagramEmbeds}
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
      />

      <section className="border border-navy/10 bg-white p-4 md:p-5">
        <form action={formAction} className="space-y-3">
          {formState.error ? (
            <p className="border border-terra/20 bg-terra/5 px-4 py-3 text-sm leading-relaxed text-terra">
              {formState.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-navy">
                URL do post ou reel
              </span>
              <input
                className="h-11 w-full border border-navy/15 bg-offwhite px-3 text-sm text-navy outline-none focus:border-terra"
                name="url"
                placeholder="https://www.instagram.com/p/ABC123/"
                required
                type="url"
              />
            </label>
            <button
              className="h-11 shrink-0 bg-terra px-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </section>

      <section className="border border-navy/10 bg-white">
        <div className="flex flex-col gap-2 border-b border-navy/10 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <h2 className="text-sm font-semibold">Posts cadastrados</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy">
              Arraste pela alca para reordenar. Posts inativos ficam no admin, mas nao aparecem na Home.
            </p>
          </div>
          {isPending ? (
            <p className="text-xs uppercase tracking-[0.16em] text-terra">Salvando ordem...</p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-navy/10">
            {items.map((post, index) => (
              <article
                className="flex min-h-[88px] max-h-24 items-center gap-3 overflow-hidden px-4 py-3 md:px-5"
                key={post.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) moveItem(draggedId, post.id);
                  setDraggedId(null);
                }}
              >
                <button
                  aria-label={`Arrastar post ${index + 1}`}
                  className="shrink-0 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragEnd={() => setDraggedId(null)}
                  onDragStart={() => setDraggedId(post.id)}
                  type="button"
                >
                  <DragHandle />
                </button>

                <InstagramThumbnail url={post.url} />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-navy/10 bg-offwhite px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-navy">
                      #{index + 1}
                    </span>
                    <span
                      className={`border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                        post.ativo
                          ? "border-emerald-700/10 bg-emerald-50 text-emerald-900"
                          : "border-navy/10 bg-offwhite text-navy/60"
                      }`}
                    >
                      {post.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <a
                    className="block truncate text-sm text-navy underline-offset-4 hover:text-terra hover:underline"
                    href={post.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {post.url}
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                    onClick={() => setPreviewUrl(post.url)}
                    type="button"
                  >
                    Visualizar
                  </button>
                  <form action={toggleInstagramPostAction}>
                    <input name="id" type="hidden" value={post.id} />
                    <button
                      className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                      type="submit"
                    >
                      {post.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form
                    action={deleteInstagramPostAction}
                    onSubmit={(event) => {
                      if (!window.confirm("Remover este post do Instagram?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input name="id" type="hidden" value={post.id} />
                    <button
                      aria-label={`Remover post ${index + 1}`}
                      className="grid h-9 w-9 place-items-center border border-navy/15 text-navy/55 hover:border-red-700/30 hover:text-red-700"
                      type="submit"
                    >
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm leading-relaxed text-navy md:p-6">
            Copie a URL publica de um post ou reel no Instagram pelo botao de compartilhar e cole no campo acima.
            A secao do Instagram so aparece na Home quando houver posts ativos cadastrados.
          </div>
        )}
      </section>

      {previewUrl ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-navy/65 p-4"
          role="dialog"
        >
          <div className="w-full max-w-[620px] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-navy">Preview do post</h2>
              <button
                className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                onClick={() => setPreviewUrl(null)}
                type="button"
              >
                Fechar
              </button>
            </div>
            <InstagramEmbedPreview url={previewUrl} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
