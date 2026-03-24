import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import type { Product, ProductVariation, I18nString } from "@/lib/types";
import { prisma } from "@/lib/db";
import { translateText } from "@/lib/translate";
import {
  normalizeProductSlug,
  validateAdminProductPayload,
  ATTR_MAX,
} from "@/lib/admin-product-input";

function parseVariations(body: unknown): ProductVariation[] | undefined {
  if (!Array.isArray(body)) return undefined;
  return body.map((v: unknown) => {
    const vv = v as Record<string, unknown>;
    const name = String(vv.name ?? "");
    const opts = Array.isArray(vv.options)
      ? (vv.options as Record<string, unknown>[]).map((o) => ({
          label: String(o.label ?? ""),
          price: Number(o.price) ?? 0,
          sku: o.sku != null ? String(o.sku) : undefined,
          image: o.image != null ? String(o.image) : undefined,
        }))
      : [];
    return { name, options: opts };
  }).filter((v) => v.name && v.options.length);
}

async function buildI18n(
  fallbackEn: string,
  body: unknown
): Promise<I18nString | undefined> {
  if (!fallbackEn && (!body || typeof body !== "object")) return undefined;
  const o = (body && typeof body === "object" ? (body as Record<string, unknown>) : {}) ?? {};
  const en = (o.en != null ? String(o.en) : fallbackEn) || fallbackEn;
  let zh = o.zh != null ? String(o.zh) : undefined;
  let es = (o as Record<string, unknown>).es != null ? String((o as Record<string, unknown>).es) : undefined;

  if (!zh) {
    zh = await translateText(en, "zh");
  }
  if (!es) {
    es = await translateText(en, "es");
  }
  return { en, zh, es };
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.product.findMany({ where: { source: "custom" }, orderBy: { createdAt: "asc" } });
  const products = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    image: r.image,
    images: r.images ? (JSON.parse(r.images) as string[]) : undefined,
    category: r.category,
    brandId: r.brandId,
    characterId: r.characterId ?? undefined,
    description: r.description,
    inStock: r.inStock,
    preorder: r.preorder,
    preorderEndDate: r.preorderEndDate ?? undefined,
    scale: r.scale ?? undefined,
    material: r.material ?? undefined,
    height: r.height ?? undefined,
    name_i18n: r.nameI18n ? (JSON.parse(r.nameI18n) as I18nString) : undefined,
    description_i18n: r.descriptionI18n ? (JSON.parse(r.descriptionI18n) as I18nString) : undefined,
    variations: r.variations ? (JSON.parse(r.variations) as ProductVariation[]) : undefined,
    domesticOnly: r.domesticOnly,
    source: "custom" as const,
  }));
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const id = body.id as string | undefined;
    const isUpdate = !!id;

    const imageList = Array.isArray(body.images) ? (body.images as string[]).filter(Boolean) : [];
    const image = imageList.length ? imageList[0] : String(body.image ?? "").trim();

    const nameEn = String(body.name ?? body.name_i18n?.en ?? "").trim();
    const descEn = String(body.description ?? body.description_i18n?.en ?? "").trim();
    const slugInput = String(body.slug ?? "").trim();
    const slug = normalizeProductSlug(slugInput, nameEn);

    const price = Number(body.price);
    const originalPrice =
      body.originalPrice != null && body.originalPrice !== ""
        ? Number(body.originalPrice)
        : null;

    const category = String(body.category ?? "action-figure");
    const brandId = String(body.brandId ?? "marvel");
    const characterIdRaw = body.characterId != null ? String(body.characterId).trim() : "";
    const characterId = characterIdRaw || null;

    const variationsParsed = parseVariations(body.variations);

    const scaleRaw = body.scale != null ? String(body.scale) : "";
    const materialRaw = body.material != null ? String(body.material) : "";
    const heightRaw = body.height != null ? String(body.height) : "";
    const scale = scaleRaw ? scaleRaw.slice(0, ATTR_MAX) : null;
    const material = materialRaw ? materialRaw.slice(0, ATTR_MAX) : null;
    const height = heightRaw ? heightRaw.slice(0, ATTR_MAX) : null;

    const preorderEndRaw = body.preorderEndDate != null ? String(body.preorderEndDate) : "";
    if (preorderEndRaw.length > 64) {
      return NextResponse.json({ error: "Pre-order end date is too long." }, { status: 400 });
    }

    const validationError = validateAdminProductPayload({
      nameEn,
      descEn,
      slug,
      price,
      originalPrice,
      primaryImage: image,
      imageUrls: imageList.length ? imageList : image ? [image] : [],
      category,
      brandId,
      characterId,
      variations: variationsParsed,
      scale,
      material,
      height,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const slugOwner = await prisma.product.findUnique({ where: { slug } });
    if (slugOwner && (!isUpdate || slugOwner.id !== id)) {
      return NextResponse.json(
        { error: "This slug is already used by another product. Choose a different slug." },
        { status: 400 },
      );
    }

    const nameI18n = await buildI18n(nameEn, body.name_i18n);
    const descriptionI18n = await buildI18n(descEn, body.description_i18n);

    const gallery = imageList.length ? imageList : [image];
    const data = {
      name: nameEn,
      slug,
      price,
      originalPrice,
      image,
      images: gallery.length ? JSON.stringify(gallery) : null,
      category,
      brandId,
      characterId,
      description: descEn,
      inStock: Boolean(body.inStock !== false),
      preorder: Boolean(body.preorder),
      preorderEndDate: preorderEndRaw || null,
      scale,
      material,
      height,
      nameI18n: nameI18n ? JSON.stringify(nameI18n) : null,
      descriptionI18n: descriptionI18n ? JSON.stringify(descriptionI18n) : null,
      variations: variationsParsed?.length ? JSON.stringify(variationsParsed) : null,
      domesticOnly: Boolean(body.domesticOnly),
      source: "custom" as const,
    };

    let product;
    if (isUpdate) {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing || existing.source !== "custom") {
        return NextResponse.json({ error: "Product not found or not editable" }, { status: 404 });
      }
      product = await prisma.product.update({ where: { id }, data });
    } else {
      product = await prisma.product.create({ data });
    }

    const p: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      image: product.image,
      images: product.images ? (JSON.parse(product.images) as string[]) : undefined,
      category: product.category as Product["category"],
      brandId: product.brandId as Product["brandId"],
      characterId: product.characterId ?? undefined,
      description: product.description,
      inStock: product.inStock,
      preorder: product.preorder,
      preorderEndDate: product.preorderEndDate ?? undefined,
      scale: product.scale ?? undefined,
      material: product.material ?? undefined,
      height: product.height ?? undefined,
      name_i18n: product.nameI18n ? (JSON.parse(product.nameI18n) as I18nString) : undefined,
      description_i18n: product.descriptionI18n ? (JSON.parse(product.descriptionI18n) as I18nString) : undefined,
      variations: product.variations ? (JSON.parse(product.variations) as ProductVariation[]) : undefined,
      domesticOnly: product.domesticOnly,
      source: "custom",
    };
    return NextResponse.json({ ok: true, product: p });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.source !== "custom") {
    return NextResponse.json({ error: "Product not found or cannot be deleted" }, { status: 404 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
