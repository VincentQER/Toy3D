import Link from "next/link";
import { getAllProducts } from "@/lib/server-data";

export default async function AdminDashboardPage() {
  const all = await getAllProducts();
  const custom = all.filter((p) => p.source === "custom");

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white">Dashboard</h2>
      <p className="mt-2 text-zinc-400">Manage products and orders (orders coming later).</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
          <p className="text-3xl font-bold text-white">{all.length}</p>
          <p className="mt-1 text-zinc-400">Total products</p>
          <Link href="/admin/products" className="mt-3 inline-block text-sm text-amber-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
          <p className="text-3xl font-bold text-white">{custom.length}</p>
          <p className="mt-1 text-zinc-400">Custom / uploaded</p>
          <Link href="/admin/products/new" className="mt-3 inline-block text-sm text-amber-400 hover:underline">
            Add product →
          </Link>
        </div>
      </div>
      <p className="mt-6 text-sm text-zinc-500">
        Log in with <strong>admin@printfig.com</strong> (any password) to access admin. Products you add here are stored in the database and appear on the store immediately.
      </p>
    </div>
  );
}
