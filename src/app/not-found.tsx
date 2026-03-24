import type { Metadata } from "next";
import { NotFoundContent } from "./NotFoundContent";

export const metadata: Metadata = {
  title: { absolute: "Page not found | PrintFig" },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
