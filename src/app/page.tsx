import { categories } from "@/lib/data";
import { buildHomePageJsonLd } from "@/lib/site-jsonld";
import { getAllProducts } from "@/lib/server-data";
import { HomeContent } from "./HomeContent";

const featuredIds = ["1", "2", "4", "5"];

export default async function HomePage() {
  const allProducts = await getAllProducts();
  const featured = allProducts.filter((p) => featuredIds.includes(p.id));
  const jsonLd = buildHomePageJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent categories={categories} featured={featured} />
    </>
  );
}
