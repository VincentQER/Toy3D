"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface AdminOrderRow {
  id: string;
  createdAt: string;
  userEmail: string;
  total: number;
  status: OrderStatus;
  shippingName: string;
  trackingNumber: string | null;
  carrier: string | null;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminOrdersTable({
  orders,
  className = "",
}: {
  orders: AdminOrderRow[];
  className?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminOrderRow[]>(orders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tableError, setTableError] = useState("");

  const updateRow = (id: string, patch: Partial<AdminOrderRow>) => {
    setRows((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const handleSave = async (order: AdminOrderRow) => {
    setSavingId(order.id);
    setTableError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: order.status,
          trackingNumber: order.trackingNumber || null,
          carrier: order.carrier || null,
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = raw || `Failed to update order (${res.status})`;
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
    } finally {
      setSavingId(null);
    }
  };

  if (!rows.length) {
    return (
      <div className={`rounded-xl border border-zinc-800 bg-brand-card p-8 text-center text-zinc-500 ${className}`}>
        No orders yet.
      </div>
    );
  }

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
            <th className="p-3 font-medium text-zinc-400">Order</th>
            <th className="p-3 font-medium text-zinc-400">Date</th>
            <th className="p-3 font-medium text-zinc-400">Customer</th>
            <th className="p-3 font-medium text-zinc-400">Total</th>
            <th className="p-3 font-medium text-zinc-400">Status</th>
            <th className="p-3 font-medium text-zinc-400">Tracking</th>
            <th className="p-3 font-medium text-zinc-400">Carrier</th>
            <th className="p-3 font-medium text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id} className="border-b border-zinc-800/50">
              <td className="p-3 text-zinc-200">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="text-amber-400 hover:underline"
                >
                  {order.id.slice(0, 8)}
                </button>
              </td>
              <td className="p-3 text-zinc-400">{order.createdAt}</td>
              <td className="p-3 text-zinc-400">
                <div className="flex flex-col">
                  <span>{order.shippingName}</span>
                  <span className="text-xs text-zinc-500">{order.userEmail}</span>
                </div>
              </td>
              <td className="p-3 text-zinc-200">${order.total.toFixed(2)}</td>
              <td className="p-3">
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateRow(order.id, { status: e.target.value as OrderStatus })
                  }
                  className="w-32 rounded-lg border border-zinc-700 bg-brand-dark px-2 py-1 text-xs text-zinc-100"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3">
                <input
                  type="text"
                  value={order.trackingNumber ?? ""}
                  onChange={(e) => updateRow(order.id, { trackingNumber: e.target.value })}
                  className="w-40 rounded-lg border border-zinc-700 bg-brand-dark px-2 py-1 text-xs text-zinc-100"
                  placeholder="Tracking #"
                />
              </td>
              <td className="p-3">
                <input
                  type="text"
                  value={order.carrier ?? ""}
                  onChange={(e) => updateRow(order.id, { carrier: e.target.value })}
                  className="w-28 rounded-lg border border-zinc-700 bg-brand-dark px-2 py-1 text-xs text-zinc-100"
                  placeholder="UPS/USPS"
                />
              </td>
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => handleSave(order)}
                  disabled={savingId === order.id}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400 disabled:opacity-60"
                >
                  {savingId === order.id ? "Saving…" : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

