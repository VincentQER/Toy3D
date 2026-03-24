import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/server-data";
import { ProductForm } from "../../ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;
  const products = await getAllProducts();
  const product = products.find((p) => p.id === id);

  if (!product || product.source !== "custom") {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/products" className="text-sm text-zinc-400 hover:text-white">← Products</Link>
      </div>
      <h2 className="font-display text-xl font-bold text-white">Edit Product</h2>
      <p className="mt-2 text-zinc-400">{product.name}</p>
      <ProductForm initial={product} className="mt-8" />
    </div>
  );
}
