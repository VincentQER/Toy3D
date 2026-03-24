import { ProductForm } from "../ProductForm";

export default function AdminNewProductPage() {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white">Add Product</h2>
      <p className="mt-2 text-zinc-400">New toys will appear on the store and in product lists.</p>
      <ProductForm className="mt-8" />
    </div>
  );
}
