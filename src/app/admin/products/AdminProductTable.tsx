"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";

export function AdminProductTable({
  products,
  className = "",
}: {
  products: Product[];
  className?: string;
}) {
  const router = useRouter();
  const [tableError, setTableError] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setTableError("");
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const raw = await res.text();
    if (!res.ok) {
      let msg = raw || `Delete failed (${res.status})`;
      try {
        const j = JSON.parse(raw) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* keep msg */
      }
      setTableError(msg);
      return;
    }
    router.refresh();
  };

  return (
    <div className={className}>
      {tableError ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {tableError}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="p-3 font-medium text-zinc-400">Name</th>
            <th className="p-3 font-medium text-zinc-400">Brand</th>
            <th className="p-3 font-medium text-zinc-400">Category</th>
            <th className="p-3 font-medium text-zinc-400">Price</th>
            <th className="p-3 font-medium text-zinc-400">Source</th>
            <th className="p-3 font-medium text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-zinc-800/50">
              <td className="p-3">
                <Link href={`/products/${p.slug}`} className="text-white hover:text-amber-400">
                  {p.name}
                </Link>
              </td>
              <td className="p-3 text-zinc-400">{p.brandId}</td>
              <td className="p-3 text-zinc-400">{p.category}</td>
              <td className="p-3 text-zinc-400">${p.price}</td>
              <td className="p-3">
                {p.source === "custom" ? (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Custom</span>
                ) : (
                  <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-500">Default</span>
                )}
              </td>
              <td className="p-3">
                {p.source === "custom" ? (
                  <>
                    <Link href={`/admin/products/${p.id}/edit`} className="mr-2 text-amber-400 hover:underline">Edit</Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
