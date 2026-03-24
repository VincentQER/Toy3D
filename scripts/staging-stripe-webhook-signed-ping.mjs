/**
 * Staging / QA: POST a valid Stripe-signed webhook (non-checkout) to verify
 * STRIPE_WEBHOOK_SECRET + raw body handling. Does not exercise fulfillment DB path.
 *
 * Usage: node scripts/staging-stripe-webhook-signed-ping.mjs
 * Env: STRIPE_WEBHOOK_SECRET (required), STRIPE_WEBHOOK_TEST_BASE (default http://127.0.0.1:3000)
 */
import "dotenv/config";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const base = (process.env.STRIPE_WEBHOOK_TEST_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");

if (!webhookSecret) {
  console.error("STRIPE_WEBHOOK_SECRET is missing");
  process.exit(2);
}

/** Stripe-style id (SDK-signed test payload; use Stripe CLI for cloud-issued evt_*). */
const eventId = "evt_1RStagingP0SignedPing20260324000001";

const payload = JSON.stringify({
  id: eventId,
  object: "event",
  api_version: "2024-06-20",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: "cus_staging_smoke",
      object: "customer",
      email: "staging-smoke@example.com",
    },
  },
  livemode: false,
  pending_webhooks: 0,
  request: { id: null, idempotency_key: null },
  type: "customer.created",
});

const stripeSignature = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret: webhookSecret,
});

const res = await fetch(`${base}/api/stripe/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": stripeSignature,
  },
  body: payload,
});

const bodyText = await res.text();
console.log(
  JSON.stringify(
    {
      ok: res.ok,
      httpStatus: res.status,
      responseBody: bodyText,
      injectedStripeEventId: eventId,
      target: `${base}/api/stripe/webhook`,
    },
    null,
    2,
  ),
);

process.exit(res.ok ? 0 : 1);
