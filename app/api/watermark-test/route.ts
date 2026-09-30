/**
 * Aplica marca d'água nas fotos de um imóvel, uma leva por chamada.
 *
 * Chamado pelo botão "Reaplicar Marca d'Água" do Sanity Studio e pelo
 * Adalink-CRM na aprovação de captação. Ambos fazem GET em loop, avançando
 * `start` pelo `nextStart` devolvido, até `done:true`/`nextStart:-2`.
 *
 * GET /api/watermark-test?id=<propertyDocId>&limit=4&force=false&start=-1
 *
 * Config visual vem do documento singleton `watermarkSettings` no Sanity
 * (posição, tamanho, opacidade etc.) — ver src/sanity/schemaTypes/watermarkSettings.ts
 * no Studio. Sem esse doc, usa os defaults abaixo (mesmos do schema).
 *
 * Adaptado de LanPortus/nova proposta claude/api/watermark-test.js (Pages
 * Router) para App Router. Mesmo contrato de request/response.
 *
 * Requer no ambiente da Vercel: SANITY_PROJECT_ID, SANITY_DATASET,
 * SANITY_WRITE_TOKEN (permissão Editor).
 */
import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import sharp, { type OverlayOptions } from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

const WATERMARK_TAG = "watermarked";

// Fallback ao projectId/dataset fixos (mesmo padrão de lib/sanity.ts): sem
// isso, a ausência da env var na Vercel derruba o build inteiro com
// "Configuration must contain `projectId`" ao coletar dados da rota — já
// aconteceu uma vez (commit b8583c7, 30/09/2026).
const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "xpdl3i95",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

type AspectRatioCrop = "none" | "4:3" | "3:4";

interface WatermarkSettings {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center" | "center";
  sizePercent: number;
  opacity: number;
  padding: number;
  paddingBottom: number;
  showShadow: boolean;
  aspectRatioCrop: AspectRatioCrop;
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  position: "bottom-right",
  sizePercent: 22,
  opacity: 90,
  padding: 3.5,
  paddingBottom: 3.5,
  showShadow: false,
  aspectRatioCrop: "none",
};

let logoBuffer: Buffer | null = null;
async function getLogo(): Promise<Buffer> {
  if (logoBuffer) return logoBuffer;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "https://inglaterrapremium.vercel.app"}/images/logo-white.png`
  );
  logoBuffer = Buffer.from(await res.arrayBuffer());
  return logoBuffer;
}

interface WatermarkSettingsDoc extends Partial<Omit<WatermarkSettings, "aspectRatioCrop">> {
  aspectRatioCrop?: AspectRatioCrop;
  // Campo legado (pré-migração): true = "4:3", false = "none". Só é lido
  // quando `aspectRatioCrop` ainda não existe no documento — nunca escrito
  // de novo por este endpoint.
  forceAspectRatio?: boolean;
}

async function getSettings(): Promise<WatermarkSettings> {
  try {
    const s = await sanity.fetch<WatermarkSettingsDoc | null>(
      `*[_id == "watermarkSettings" || _id == "drafts.watermarkSettings"] | order(_updatedAt desc) [0] { position, sizePercent, opacity, padding, paddingBottom, showShadow, aspectRatioCrop, forceAspectRatio }`
    );
    if (!s) return DEFAULT_SETTINGS;

    const aspectRatioCrop: AspectRatioCrop =
      s.aspectRatioCrop ?? (s.forceAspectRatio ? "4:3" : "none");

    const nonNull = Object.fromEntries(
      Object.entries(s).filter(([k, v]) => v != null && k !== "forceAspectRatio" && k !== "aspectRatioCrop")
    );
    return { ...DEFAULT_SETTINGS, ...nonNull, aspectRatioCrop };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getPosition(
  pos: WatermarkSettings["position"],
  w: number,
  h: number,
  lw: number,
  lh: number,
  px: number,
  py: number
) {
  switch (pos) {
    case "top-left":
      return { left: px, top: py };
    case "top-right":
      return { left: w - lw - px, top: py };
    case "bottom-left":
      return { left: px, top: h - lh - py };
    case "bottom-center":
      return { left: Math.round((w - lw) / 2), top: h - lh - py };
    case "center":
      return { left: Math.round((w - lw) / 2), top: Math.round((h - lh) / 2) };
    default:
      return { left: w - lw - px, top: h - lh - py };
  }
}

async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const settings = await getSettings();

  let processedBuffer = imageBuffer;
  if (settings.aspectRatioCrop !== "none") {
    const meta = await sharp(imageBuffer).metadata();
    const origW = meta.width || 1600;
    const origH = meta.height || 1200;
    const TARGET_RATIO = settings.aspectRatioCrop === "3:4" ? 3 / 4 : 4 / 3;
    const origRatio = origW / origH;
    if (Math.abs(origRatio - TARGET_RATIO) > 0.01) {
      let newW = origW;
      let newH = origH;
      if (origRatio > TARGET_RATIO) newW = Math.round(origH * TARGET_RATIO);
      else newH = Math.round(origW / TARGET_RATIO);
      processedBuffer = await sharp(imageBuffer)
        .resize({ width: newW, height: newH, fit: "cover", position: "center" })
        .toBuffer();
    }
  }

  const metadata = await sharp(processedBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const logoWidth = Math.round(width * (settings.sizePercent / 100));
  const logoSrc = await getLogo();
  const alphaValue = Math.round((settings.opacity / 100) * 255);

  const logo = await sharp(logoSrc)
    .resize(logoWidth)
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, alphaValue]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();
  const logoW = logoMeta.width || 120;
  const logoH = logoMeta.height || 40;

  const padX = Math.round(width * (settings.padding / 100));
  const padY = Math.round(height * (settings.paddingBottom / 100));
  const { left, top } = getPosition(settings.position, width, height, logoW, logoH, padX, padY);

  const composites: OverlayOptions[] = [];

  if (settings.showShadow) {
    const shadowPad = Math.round(logoH * 0.3);
    const shadowBg = await sharp({
      create: {
        width: logoW + shadowPad * 2,
        height: logoH + shadowPad * 2,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.35 },
      },
    })
      .png()
      .blur(8)
      .toBuffer();

    composites.push({
      input: shadowBg,
      left: Math.max(0, left - shadowPad),
      top: Math.max(0, top - shadowPad),
      blend: "over",
    });
  }

  composites.push({ input: logo, left: Math.max(0, left), top: Math.max(0, top), blend: "over" });

  return sharp(processedBuffer)
    .composite(composites)
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
}

async function processImageRef(assetRef: string, force: boolean): Promise<string | null> {
  const asset = await sanity.fetch<{ _id: string; url: string; label?: string; description?: string } | null>(
    `*[_id == $ref][0] { _id, url, label, description }`,
    { ref: assetRef }
  );
  if (!asset) return null;

  if (!force && asset.label === WATERMARK_TAG) return null;

  let sourceAsset = asset;
  if (asset.description?.startsWith("original-id:")) {
    const originalId = asset.description.replace("original-id:", "").trim();
    const originalAsset = await sanity.fetch<{ _id: string; url: string } | null>(
      `*[_id == $ref][0] { _id, url }`,
      { ref: originalId }
    );
    if (originalAsset) sourceAsset = originalAsset;
  }

  const imgRes = await fetch(sourceAsset.url);
  if (!imgRes.ok) return null;
  const original = Buffer.from(await imgRes.arrayBuffer());
  const watermarked = await applyWatermark(original);

  const newAsset = await sanity.assets.upload("image", watermarked, {
    filename: `wm-${sourceAsset._id}.jpg`,
    contentType: "image/jpeg",
    label: WATERMARK_TAG,
    description: `original-id:${sourceAsset._id}`,
  });
  return newAsset._id;
}

interface PropertyImages {
  _id: string;
  mainImage?: { asset?: { _ref?: string } };
  images?: Array<{ asset?: { _ref?: string } }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Passe ?id=<documentId>" }, { status: 400 });
  }

  try {
    const property = await sanity.fetch<PropertyImages | null>(
      `*[_id == $id][0] { _id, mainImage, images }`,
      { id }
    );
    if (!property) {
      return NextResponse.json({ success: false, error: `Imóvel não encontrado: ${id}` }, { status: 404 });
    }

    const limit = parseInt(searchParams.get("limit") || "1", 10);
    const force = searchParams.get("force") === "true";
    const start = parseInt(searchParams.get("start") || "-1", 10);

    const patch: Record<string, unknown> = {};
    let changes = 0;
    let nextStart = start;
    let totalRemaining = 0;

    if (start === -1 && property.mainImage?.asset?._ref && changes < limit) {
      const newRef = await processImageRef(property.mainImage.asset._ref, force);
      if (newRef) {
        patch["mainImage.asset._ref"] = newRef;
        changes++;
      }
      nextStart = 0;
    }

    if (Array.isArray(property.images)) {
      const startIdx = Math.max(0, start === -1 ? 0 : start);
      for (let i = startIdx; i < property.images.length; i++) {
        if (changes >= limit) {
          nextStart = i;
          totalRemaining = property.images.length - i;
          break;
        }
        const img = property.images[i];
        if (img?.asset?._ref) {
          const newRef = await processImageRef(img.asset._ref, force);
          if (newRef) {
            patch[`images[${i}].asset._ref`] = newRef;
            changes++;
          }
        }
        if (i === property.images.length - 1) {
          nextStart = -2;
          totalRemaining = 0;
        }
      }
    }

    if (changes > 0) {
      await sanity.patch(id).set(patch).commit();
    }

    return NextResponse.json({
      success: true,
      propertyId: id,
      changes,
      nextStart,
      totalRemaining,
      done: nextStart === -2,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
