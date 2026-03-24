import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

type VariantSnap = { variationName?: string; optionLabel?: string };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const productIds = order.items.map((i) => i.productId);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
      })
    : [];

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white">Order {order.id.slice(0, 8)}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Placed on {order.createdAt.toISOString().slice(0, 10)} · Customer:{" "}
        <span className="text-zinc-200">{order.shippingName}</span> (
        <span className="text-zinc-300">{order.user.email}</span>)
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-brand-card p-4">
          <h3 className="font-semibold text-white">Items</h3>
          <ul className="divide-y divide-zinc-800 text-sm">
            {order.items.map((item) => {
              const product = productMap.get(item.productId);
              let variant: VariantSnap | null = null;
              if (item.variantSnapshot) {
                try {
                  const parsed = JSON.parse(item.variantSnapshot) as unknown;
                  if (parsed && typeof parsed === "object") {
                    variant = parsed as VariantSnap;
                  }
                } catch {
                  /* ignore */
                }
              }
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium text-zinc-100">
                      {product?.name ?? "Unknown product"}
                    </div>
                    {variant?.optionLabel && (
                      <div className="text-xs text-zinc-500">
                        {variant.variationName}: {variant.optionLabel}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-zinc-500">
                      Qty {item.quantity}
                    </div>
                  </div>
                  <div className="text-right text-sm text-zinc-100">
                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 bg-brand-card p-4 text-sm text-zinc-300">
          <h3 className="font-semibold text-white">Summary</h3>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="capitalize text-zinc-100">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Total</span>
            <span className="text-zinc-100">${order.total.toFixed(2)}</span>
          </div>
          <div className="mt-3 border-t border-zinc-800 pt-3">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Shipping address
            </div>
            <div className="mt-1 text-zinc-200">{order.shippingName}</div>
            <div className="text-zinc-400">{order.shippingPhone}</div>
            <div className="text-zinc-400">{order.shippingAddress}</div>
          </div>
          {(order.trackingNumber || order.carrier) && (
            <div className="mt-3 border-t border-zinc-800 pt-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Tracking
              </div>
              <div className="mt-1 text-zinc-200">
                {order.trackingNumber ?? "-"}
              </div>
              <div className="text-zinc-400">{order.carrier ?? "-"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

