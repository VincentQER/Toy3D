import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: {
    absolute: "About PrintFig | 3D printed figures & collectibles",
  },
  description:
    "Learn more about PrintFig, our focus on high-quality 3D printed figures, statues and original designs for collectors.",
};

export default function AboutPage() {
  return <AboutContent />;
}
