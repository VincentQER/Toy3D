/**
 * Prints order status transition log lines for staging / P0 evidence.
 * Requires DATABASE_URL + migrated DB + seed (at least one user + product).
 *
 * Usage: npx tsx scripts/staging-order-transition-evidence.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  const product = await prisma.product.findFirst();
  if (!admin || !product) {
    console.error("[evidence] Need seeded admin user and at least one product. Run: npx prisma db seed");
    process.exit(1);
  }

  let order = await prisma.order.findFirst({ orderBy: { createdAt: "desc" } });
  if (!order) {
    order = await prisma.order.create({
      data: {
        userId: admin.id,
        status: "pending",
        total: product.price,
        shippingName: "Staging Buyer",
        shippingPhone: "+15555550100",
        shippingAddress: "123 Staging Ave, Seattle, WA",
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              priceAtPurchase: product.price,
            },
          ],
        },
      },
    });
    console.log("[evidence] created demo order", order.id, "status=pending");
  }

  console.log("[evidence] order", order.id, "before:", order.status);

  const paid = await prisma.order.update({
    where: { id: order.id },
    data: { status: "paid" },
  });
  console.log("[evidence] order", order.id, "transition -> paid:", paid.status);

  const shipped = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "shipped",
      trackingNumber: "9400111899223344556677",
      carrier: "USPS",
    },
  });
  console.log(
    "[evidence] order",
    order.id,
    "transition -> shipped:",
    shipped.status,
    "carrier:",
    shipped.carrier,
    "tracking:",
    shipped.trackingNumber,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
