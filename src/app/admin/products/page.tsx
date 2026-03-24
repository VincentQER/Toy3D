import Link from "next/link";
import { getAllProducts } from "@/lib/server-data";
import { AdminProductTable } from "./AdminProductTable";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">Products</h2>
        <Link href="/admin/products/new" className="btn-primary">
          Add Product
        </Link>
      </div>
      <p className="mt-2 text-zinc-400">Default products are from code; custom ones can be edited or deleted.</p>
      <AdminProductTable products={products} className="mt-6" />
    </div>
  );
}
