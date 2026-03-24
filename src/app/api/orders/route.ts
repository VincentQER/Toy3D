import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { validateCartLines } from "@/lib/order-validation";
import type { CartLineInput } from "@/lib/order-validation";
import { validateShippingFields } from "@/lib/order-shipping-input";
import { checkRateLimit } from "@/lib/rate-limit-memory";

const ORDER_SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const ORDER_SUBMIT_MAX_PER_USER = 40;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Please log in to place an order" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const limited = checkRateLimit(
    `post-order:${user.id}`,
    ORDER_SUBMIT_MAX_PER_USER,
    ORDER_SUBMIT_WINDOW_MS,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many orders submitted. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = await request.json();
    const { items, shippingName, shippingPhone, shippingAddress } = body as {
      items?: CartLineInput[];
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
    };

    if (!items?.length || !shippingName || !shippingPhone || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields: items, shippingName, shippingPhone, shippingAddress" },
        { status: 400 },
      );
    }

    const shipErr = validateShippingFields(shippingName, shippingPhone, shippingAddress);
    if (shipErr) {
      return NextResponse.json({ error: shipErr }, { status: 400 });
    }

    const validated = await validateCartLines(items);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const orderItems = validated.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      variantSnapshot: l.variantSnapshot,
      priceAtPurchase: l.priceAtPurchase,
    }));

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "pending",
        total: validated.total,
        shippingName: String(shippingName).trim(),
        shippingPhone: String(shippingPhone).trim(),
        shippingAddress: String(shippingAddress).trim(),
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNames = new Map(products.map((p) => [p.id, p.name]));

    const emailResult = await sendOrderConfirmationEmail(session.user.email, {
      id: order.id,
      total: order.total,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        priceAtPurchase: i.priceAtPurchase,
      })),
    }, productNames);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      confirmationEmailSent: emailResult.sent,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
