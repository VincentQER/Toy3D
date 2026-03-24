import { prisma } from "@/lib/db";
import { AdminOrdersTable, type AdminOrderRow } from "./AdminOrdersTable";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString().slice(0, 10),
    userEmail: o.user.email,
    total: o.total,
    status: o.status as AdminOrderRow["status"],
    shippingName: o.shippingName,
    trackingNumber: o.trackingNumber ?? null,
    carrier: o.carrier ?? null,
  }));

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white">Orders</h2>
      <p className="mt-2 text-zinc-400">
        View and update order status, tracking number and carrier.
      </p>
      <AdminOrdersTable orders={rows} className="mt-6" />
    </div>
  );
}

