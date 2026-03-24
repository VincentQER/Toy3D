import "dotenv/config";
import bcrypt from "bcryptjs";
import { products } from "../src/lib/data";
import type { Product } from "../src/lib/types";
import { prisma } from "../src/lib/db";

function toDbProduct(p: Product, source: "default" | "custom") {
  return {
    name: p.name,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    image: p.image,
    images: p.images ? JSON.stringify(p.images) : null,
    category: p.category,
    brandId: p.brandId,
    characterId: p.characterId ?? null,
    description: p.description,
    inStock: p.inStock,
    preorder: p.preorder ?? false,
    preorderEndDate: p.preorderEndDate ?? null,
    scale: p.scale ?? null,
    material: p.material ?? null,
    height: p.height ?? null,
    nameI18n: p.name_i18n ? JSON.stringify(p.name_i18n) : null,
    descriptionI18n: p.description_i18n ? JSON.stringify(p.description_i18n) : null,
    variations: p.variations ? JSON.stringify(p.variations) : null,
    domesticOnly: p.domesticOnly ?? true,
    source,
  };
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@printfig.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        name: "Admin",
        role: "admin",
      },
    });
    console.log("Created admin user:", adminEmail);
  }

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: { id: p.id, ...toDbProduct(p, "default") },
      update: toDbProduct(p, "default"),
    });
  }
  console.log("Seeded", products.length, "default products");

  // Migrate custom products from JSON if exists
  try {
    const fs = await import("fs");
    const path = await import("path");
    const customPath = path.join(process.cwd(), "data", "custom-products.json");
    if (fs.existsSync(customPath)) {
      const raw = fs.readFileSync(customPath, "utf-8");
      const custom: Product[] = JSON.parse(raw);
      for (const p of custom) {
        await prisma.product.upsert({
          where: { slug: p.slug },
          create: { id: p.id, ...toDbProduct(p, "custom") },
          update: toDbProduct(p, "custom"),
        });
      }
      console.log("Migrated", custom.length, "custom products from JSON");
    }
  } catch {
    // ignore
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
