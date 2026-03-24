import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { validateCartLines } from "@/lib/order-validation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { CartLineInput } from "@/lib/order-validation";
import { validateShippingFields } from "@/lib/order-shipping-input";
import { checkRateLimit } from "@/lib/rate-limit-memory";

const STRIPE_CHECKOUT_WINDOW_MS = 60 * 60 * 1000;
const STRIPE_CHECKOUT_MAX_PER_USER = 40;

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const limited = checkRateLimit(
    `stripe-checkout:${user.id}`,
    STRIPE_CHECKOUT_MAX_PER_USER,
    STRIPE_CHECKOUT_WINDOW_MS,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again later." },
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

    if (!shippingName || !shippingPhone || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing shippingName, shippingPhone, or shippingAddress" },
        { status: 400 },
      );
    }

    const shipErr = validateShippingFields(shippingName, shippingPhone, shippingAddress);
    if (shipErr) {
      return NextResponse.json({ error: shipErr }, { status: 400 });
    }

    const validated = await validateCartLines(items ?? []);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const base = getSiteUrl();
    const stripe = getStripe();

    const itemsPayload = validated.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      priceAtPurchase: l.priceAtPurchase,
      variantSnapshot: l.variantSnapshot,
    }));

    const itemsJson = JSON.stringify(itemsPayload);
    if (itemsJson.length > 4500) {
      return NextResponse.json(
        { error: "Cart is too large for checkout; remove some items" },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: validated.lines.map((line) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(line.priceAtPurchase * 100),
          product_data: {
            name: line.displayName.slice(0, 250),
          },
        },
        quantity: line.quantity,
      })),
      customer_email: session.user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        shippingName: String(shippingName).slice(0, 500),
        shippingPhone: String(shippingPhone).slice(0, 500),
        shippingAddress: String(shippingAddress).slice(0, 500),
        itemsJson,
      },
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error("[stripe checkout-session]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
