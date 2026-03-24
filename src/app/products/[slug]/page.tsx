import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/server-data";
import { buildProductBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/product-jsonld";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function truncateMeta(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: { absolute: "Product not found | PrintFig" },
      robots: { index: false, follow: true },
    };
  }
  const name = product.name_i18n?.en ?? product.name;
  const description = product.description_i18n?.en ?? product.description;
  const images = product.images?.length ? product.images : [product.image];
  const mainImage = images[0];
  /** 使用根布局 title.template →「{name} | PrintFig」 */
  const title = name;
  const desc = truncateMeta(description, 155);
  const canonicalPath = `/products/${slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${name} | PrintFig`,
      description: truncateMeta(description, 200),
      type: "website",
      url: canonicalPath,
      images: mainImage ? [{ url: mainImage, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | PrintFig`,
      description: desc,
      images: mainImage ? [mainImage] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const productJsonLd = buildProductJsonLd(product, slug);
  const breadcrumbJsonLd = buildProductBreadcrumbJsonLd(product, slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductBreadcrumb product={product} />
      <ProductDetailClient product={product} />
    </div>
  );
}
