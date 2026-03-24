import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";

/** 结账页用于判断是否显示「银行卡支付」 */
export function GET() {
  return NextResponse.json({ enabled: isStripeConfigured() });
}
