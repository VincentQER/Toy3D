import type { Metadata } from "next";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";

export const metadata: Metadata = {
  title: { absolute: "Payment successful | PrintFig" },
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessClient />;
}
