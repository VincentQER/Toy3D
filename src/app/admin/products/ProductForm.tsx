"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariation, ProductVariationOption } from "@/lib/types";
import type { CategoryId, BrandId } from "@/lib/types";
import { brands, characters } from "@/lib/data";
import { getProductGallery } from "@/lib/product-i18n";

const categories: { id: CategoryId; name: string }[] = [
  { id: "action-figure", name: "Action Figure" },
  { id: "statue", name: "Statues & Scales" },
  { id: "preorder", name: "Pre-Order" },
];

interface ProductFormProps {
  initial?: Product | null;
  className?: string;
}

export function ProductForm({ initial, className = "" }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [activeLang, setActiveLang] = useState<"en" | "zh">("en");

  const defaultImages = initial ? getProductGallery(initial) : [];
  const [images, setImages] = useState<string[]>(defaultImages.length ? defaultImages : [""]);
  const [variations, setVariations] = useState<ProductVariation[]>(initial?.variations ?? []);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    name_zh: initial?.name_i18n?.zh ?? "",
    slug: initial?.slug ?? "",
    price: initial?.price ?? 0,
    originalPrice: initial?.originalPrice ?? "",
    category: (initial?.category ?? "action-figure") as CategoryId,
    brandId: (initial?.brandId ?? "marvel") as BrandId,
    characterId: initial?.characterId ?? "",
    description: initial?.description ?? "",
    description_zh: initial?.description_i18n?.zh ?? "",
    inStock: initial?.inStock ?? true,
    preorder: initial?.preorder ?? false,
    preorderEndDate: initial?.preorderEndDate ?? "",
    scale: initial?.scale ?? "",
    material: initial?.material ?? "",
    height: initial?.height ?? "",
    domesticOnly: initial?.domesticOnly ?? true,
  });

  const charOptions = characters.filter((c) => c.brandId === form.brandId);

  const addImage = () => setImages((prev) => [...prev, ""]);
  const removeImage = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));
  const setImageAt = (i: number, v: string) =>
    setImages((prev) => prev.map((x, j) => (j === i ? v : x)));

  const addVariation = () => setVariations((prev) => [...prev, { name: "Scale", options: [{ label: "1/12", price: 0 }] }]);
  const removeVariation = (i: number) => setVariations((prev) => prev.filter((_, j) => j !== i));
  const setVariationAt = (i: number, v: ProductVariation) =>
    setVariations((prev) => prev.map((x, j) => (j === i ? v : x)));
  const addOption = (vi: number) => {
    setVariations((prev) =>
      prev.map((v, j) =>
        j === vi ? { ...v, options: [...v.options, { label: "", price: 0 }] } : v
      )
    );
  };
  const removeOption = (vi: number, oi: number) => {
    setVariations((prev) =>
      prev.map((v, j) => (j === vi ? { ...v, options: v.options.filter((_, k) => k !== oi) } : v))
    );
  };
  const setOptionAt = (vi: number, oi: number, opt: ProductVariationOption) => {
    setVariations((prev) =>
      prev.map((v, j) =>
        j === vi
          ? { ...v, options: v.options.map((o, k) => (k === oi ? opt : o)) }
          : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError("");
    const imageList = images.filter(Boolean);
    if (!imageList.length) {
      setBannerError("Add at least one image URL (Images section).");
      return;
    }
    const nameEn = form.name.trim();
    const descEn = form.description.trim();
    if (!nameEn || !descEn) {
      setBannerError("Name (English) and Description (English) are required. Switch to the English tab if needed.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        ...form,
        name: nameEn,
        description: descEn,
        image: imageList[0],
        images: imageList,
        name_i18n: { en: nameEn, zh: form.name_zh || undefined },
        description_i18n: { en: descEn, zh: form.description_zh || undefined },
        originalPrice: form.originalPrice === "" ? undefined : Number(form.originalPrice),
        preorderEndDate: form.preorderEndDate || undefined,
        characterId: form.characterId || undefined,
        scale: form.scale || undefined,
        material: form.material || undefined,
        height: form.height || undefined,
        variations: variations.length ? variations : undefined,
        domesticOnly: form.domesticOnly,
      };
      if (initial?.source === "custom" && initial?.id) body.id = initial.id;
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          /* plain text error */
        }
      }
      if (!res.ok) {
        setBannerError(
          typeof data.error === "string" ? data.error : raw || `Request failed (${res.status})`,
        );
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`max-w-3xl space-y-8 ${className}`}>
      {bannerError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {bannerError}
        </div>
      ) : null}
      {/* Multi-language: EN (required) + ZH */}
      <div className="rounded-xl border border-zinc-800 bg-brand-card/50 p-6">
        <h3 className="font-semibold text-white">Multi-language (US: English primary)</h3>
        <div className="mt-2 flex gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveLang("en")}
            className={`rounded px-3 py-1 text-sm ${activeLang === "en" ? "bg-brand-accent text-white" : "text-zinc-400 hover:text-white"}`}
          >
            English *
          </button>
          <button
            type="button"
            onClick={() => setActiveLang("zh")}
            className={`rounded px-3 py-1 text-sm ${activeLang === "zh" ? "bg-brand-accent text-white" : "text-zinc-400 hover:text-white"}`}
          >
            中文
          </button>
        </div>
        {activeLang === "en" && (
          <>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Name (English) *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Description (English) *</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
              />
            </div>
          </>
        )}
        {activeLang === "zh" && (
          <>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Name (中文)</label>
              <input
                type="text"
                value={form.name_zh}
                onChange={(e) => setForm((f) => ({ ...f, name_zh: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Description (中文)</label>
              <textarea
                rows={3}
                value={form.description_zh}
                onChange={(e) => setForm((f) => ({ ...f, description_zh: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
              />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-400">Slug (URL)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="auto from name if empty"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
        />
      </div>

      {/* Multiple images (Shopify-style) */}
      <div className="rounded-xl border border-zinc-800 bg-brand-card/50 p-6">
        <h3 className="font-semibold text-white">Images * (first = main)</h3>
        <p className="mt-1 text-sm text-zinc-500">Add multiple image URLs. Reorder by editing; first URL is the main image.</p>
        {images.map((url, i) => (
          <div key={i} className="mt-3 flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setImageAt(i, e.target.value)}
              placeholder={`Image ${i + 1} URL`}
              className="flex-1 rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="rounded-lg border border-zinc-600 px-3 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addImage} className="btn-secondary mt-3">
          + Add image
        </button>
      </div>

      {/* eBay-like variations: each option has its own price */}
      <div className="rounded-xl border border-zinc-800 bg-brand-card/50 p-6">
        <h3 className="font-semibold text-white">Variations (eBay-style)</h3>
        <p className="mt-1 text-sm text-zinc-500">e.g. Scale: 1/12 ($29), 1/10 ($39). Leave empty for single price.</p>
        {variations.map((v, vi) => (
          <div key={vi} className="mt-4 rounded-lg border border-zinc-700 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={v.name}
                onChange={(e) => setVariationAt(vi, { ...v, name: e.target.value })}
                placeholder="Variation name (e.g. Scale, Color)"
                className="w-40 rounded border border-zinc-700 bg-brand-dark px-3 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={() => removeVariation(vi)}
                className="text-sm text-red-400 hover:underline"
              >
                Remove group
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {v.options.map((opt, oi) => (
                <div key={oi} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => setOptionAt(vi, oi, { ...opt, label: e.target.value })}
                    placeholder="Option (e.g. 1/12)"
                    className="w-24 rounded border border-zinc-700 bg-brand-dark px-3 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={opt.price || ""}
                    onChange={(e) => setOptionAt(vi, oi, { ...opt, price: Number(e.target.value) || 0 })}
                    placeholder="Price (USD)"
                    className="w-24 rounded border border-zinc-700 bg-brand-dark px-3 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    value={opt.sku ?? ""}
                    onChange={(e) => setOptionAt(vi, oi, { ...opt, sku: e.target.value || undefined })}
                    placeholder="SKU (optional)"
                    className="w-28 rounded border border-zinc-700 bg-brand-dark px-3 py-1.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(vi, oi)}
                    className="text-sm text-zinc-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addOption(vi)} className="text-sm text-brand-accent hover:underline">
                + Option
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addVariation} className="btn-secondary mt-3">
          + Add variation group
        </button>
      </div>

      {/* Base price when no variations */}
      {variations.length === 0 && (
        <div>
          <label className="block text-sm text-zinc-400">Price (USD) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price || ""}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
      )}
      {variations.length > 0 && (
        <div>
          <label className="block text-sm text-zinc-400">Starting price (USD) — shown as &quot;From $X&quot;</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price || ""}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
            className="mt-1 w-32 rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-zinc-400">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CategoryId }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400">Brand</label>
          <select
            value={form.brandId}
            onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value as BrandId, characterId: "" }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-zinc-400">Character (optional)</label>
        <select
          value={form.characterId}
          onChange={(e) => setForm((f) => ({ ...f, characterId: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
        >
          <option value="">—</option>
          {charOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm text-zinc-400">Scale</label>
          <input
            type="text"
            value={form.scale}
            onChange={(e) => setForm((f) => ({ ...f, scale: e.target.value }))}
            placeholder="e.g. 1/12"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">Material</label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">Height</label>
          <input
            type="text"
            value={form.height}
            onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
            placeholder="e.g. ~15cm"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
            className="rounded border-zinc-600"
          />
          <span className="text-zinc-400">In stock</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.preorder}
            onChange={(e) => setForm((f) => ({ ...f, preorder: e.target.checked }))}
            className="rounded border-zinc-600"
          />
          <span className="text-zinc-400">Pre-order</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.domesticOnly}
            onChange={(e) => setForm((f) => ({ ...f, domesticOnly: e.target.checked }))}
            className="rounded border-zinc-600"
          />
          <span className="text-zinc-400">US domestic only (境内)</span>
        </label>
      </div>
      {form.preorder && (
        <div>
          <label className="block text-sm text-zinc-400">Pre-order end date</label>
          <input
            type="text"
            value={form.preorderEndDate}
            onChange={(e) => setForm((f) => ({ ...f, preorderEndDate: e.target.value }))}
            placeholder="YYYY-MM-DD"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
      )}
      <div className="flex gap-4">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : initial ? "Update Product" : "Add Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
