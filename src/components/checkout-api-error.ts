/**
 * Maps API error text + HTTP status to a translation key so checkout never shows raw server messages.
 */
export function checkoutErrorTranslationKey(raw: string | undefined, status?: number): string {
  if (status === 429) return "checkout.errorRateLimit";
  if (status === 401) return "checkout.errorLogin";
  if (status === 503) return "checkout.errorStripeUnavailable";

  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "checkout.errorGeneric";

  if (s.includes("too many")) return "checkout.errorRateLimit";
  if (s.includes("log in") || s.includes("login to place") || s.includes("unauthorized")) {
    return "checkout.errorLogin";
  }
  if (s.includes("stripe") && (s.includes("not configured") || s.includes("unavailable"))) {
    return "checkout.errorStripeUnavailable";
  }
  if (s.includes("cart is too large")) return "checkout.errorCartTooLarge";
  if (s.includes("missing required") || s.includes("missing shipping")) return "checkout.errorValidation";

  if (
    s.includes("validation") ||
    s.includes("invalid") ||
    s.includes("shipping") ||
    s.includes("phone") ||
    s.includes("address") ||
    s.includes("required fields")
  ) {
    return "checkout.errorValidation";
  }

  if (s.length > 200 || s.includes("prisma") || s.includes("internal") || s.includes("stack")) {
    return "checkout.errorGeneric";
  }

  return "checkout.errorGeneric";
}
