import type { Category, Brand, BrandId, Character, Product } from "./types";

// 产品大类
export const categories: Category[] = [
  {
    id: "action-figure",
    name: "Action Figure",
    slug: "action-figure",
    description: "可动人偶 · 漫威、DC、索尼克等美漫与游戏角色",
  },
  {
    id: "statue",
    name: "Statues & Scales",
    slug: "statue",
    description: "雕像与比例手办，桌面陈列",
  },
  {
    id: "preorder",
    name: "Pre-Order",
    slug: "preorder",
    description: "即将到货，抢先预订",
  },
];

// 品牌 / IP
export const brands: Brand[] = [
  { id: "marvel", name: "Marvel", slug: "marvel", description: "漫威 · 复仇者、X战警等" },
  { id: "dc", name: "DC", slug: "dc", description: "DC 漫画 · 蝙蝠侠、超人、小丑等" },
  { id: "sonic", name: "Sonic", slug: "sonic", description: "索尼克 · SEGA 经典角色" },
  { id: "disney", name: "Disney", slug: "disney", description: "迪士尼 · 皮克斯、星战等" },
  { id: "video-games", name: "Video Games", slug: "video-games", description: "其他游戏 IP" },
  { id: "anime", name: "Anime", slug: "anime", description: "动漫" },
  { id: "original", name: "Original", slug: "original", description: "原创设计" },
];

// 角色（按品牌归类，便于筛选）
export const characters: Character[] = [
  { id: "wolverine", name: "Wolverine", slug: "wolverine", brandId: "marvel" },
  { id: "venom", name: "Venom", slug: "venom", brandId: "marvel" },
  { id: "spider-man", name: "Spider-Man", slug: "spider-man", brandId: "marvel" },
  { id: "iron-man", name: "Iron Man", slug: "iron-man", brandId: "marvel" },
  { id: "captain-america", name: "Captain America", slug: "captain-america", brandId: "marvel" },
  { id: "batman", name: "Batman", slug: "batman", brandId: "dc" },
  { id: "superman", name: "Superman", slug: "superman", brandId: "dc" },
  { id: "joker", name: "Joker", slug: "joker", brandId: "dc" },
  { id: "sonic", name: "Sonic", slug: "sonic", brandId: "sonic" },
  { id: "knuckles", name: "Knuckles", slug: "knuckles", brandId: "sonic" },
  { id: "shadow", name: "Shadow", slug: "shadow", brandId: "sonic" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Wolverine 金刚狼 1/12 Action Figure",
    slug: "wolverine-112-action-figure",
    price: 299,
    originalPrice: 349,
    image: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=600&h=800&fit=crop",
    category: "action-figure",
    brandId: "marvel",
    characterId: "wolverine",
    description: "Marvel 金刚狼可动人偶，多关节可动，配件含爪刃与替换手型。3D 打印树脂+关节。",
    inStock: true,
    scale: "1/12",
    material: "树脂",
    height: "约 15cm",
    name_i18n: {
      en: "Wolverine 1/12 Action Figure",
      zh: "金刚狼 1/12 可动人偶",
      es: "Figura articulada Wolverine 1/12",
    },
    description_i18n: {
      en: "Highly articulated 1/12 scale Wolverine figure with swap-out hands and claw effects, 3D printed in resin with joints.",
      zh: "Marvel 金刚狼可动人偶，多关节可动，配件含爪刃与替换手型，3D 打印树脂与关节结构。",
      es: "Figura articulada de Wolverine a escala 1/12 con manos intercambiables y efectos de garras, impresa en resina con sistema de articulaciones.",
    },
  },
  {
    id: "2",
    name: "Venom 毒液 1/10 雕像",
    slug: "venom-110-statue",
    price: 429,
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=800&fit=crop",
    category: "statue",
    brandId: "marvel",
    characterId: "venom",
    description: "Venom 毒液桌面雕像，细节涂装，适合陈列。",
    inStock: true,
    scale: "1/10",
    material: "树脂",
    height: "约 22cm",
    name_i18n: {
      en: "Venom 1/10 Statue",
      zh: "Venom 毒液 1/10 雕像",
      es: "Estatua Venom 1/10",
    },
    description_i18n: {
      en: "Desktop Venom statue with detailed paint application, perfect for display on shelves or desks.",
      zh: "Venom 毒液桌面雕像，细节涂装，适合书桌或展示架陈列。",
      es: "Estatua de Venom para escritorio con pintura detallada, ideal para exhibir en estanterías o escritorios.",
    },
  },
  {
    id: "3",
    name: "Spider-Man 蜘蛛侠 1/12 Action Figure",
    slug: "spider-man-112-action-figure",
    price: 269,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=800&fit=crop",
    category: "action-figure",
    brandId: "marvel",
    characterId: "spider-man",
    description: "经典红蓝战衣蜘蛛侠可动人偶，多关节可动，含地台与蛛丝配件。",
    inStock: true,
    scale: "1/12",
    material: "树脂",
    height: "约 15cm",
    name_i18n: {
      en: "Spider-Man 1/12 Action Figure",
      zh: "蜘蛛侠 1/12 可动人偶",
      es: "Figura articulada Spider-Man 1/12",
    },
    description_i18n: {
      en: "Classic red-and-blue Spider-Man 1/12 figure with multiple points of articulation, base and web accessories.",
      zh: "经典红蓝战衣蜘蛛侠 1/12 可动人偶，多处关节可动，附地台与蛛丝配件。",
      es: "Figura clásica de Spider-Man rojo y azul a escala 1/12, con múltiples puntos de articulación, base y accesorios de telaraña.",
    },
  },
  {
    id: "4",
    name: "Sonic 索尼克 1/8 手办 预购",
    slug: "sonic-18-figure-preorder",
    price: 319,
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop",
    category: "preorder",
    brandId: "sonic",
    characterId: "sonic",
    description: "SEGA 索尼克 1/8 比例手办，预购享优惠。预计 8 周后发货。",
    inStock: false,
    preorder: true,
    preorderEndDate: "2025-04-30",
    scale: "1/8",
    material: "树脂",
    height: "约 22cm",
    name_i18n: {
      en: "Sonic 1/8 Figure (Pre-order)",
      zh: "索尼克 1/8 手办 预购",
      es: "Figura Sonic 1/8 (preventa)",
    },
    description_i18n: {
      en: "SEGA Sonic 1/8 scale figure available as a pre-order, estimated shipping about 8 weeks after cutoff.",
      zh: "SEGA 索尼克 1/8 比例手办，预购享优惠，预计截单后约 8 周发货。",
      es: "Figura de Sonic de SEGA a escala 1/8 en preventa, envío estimado unas 8 semanas después del cierre.",
    },
  },
  {
    id: "5",
    name: "Batman 蝙蝠侠 1/12 Action Figure",
    slug: "batman-112-action-figure",
    price: 289,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=800&fit=crop",
    category: "action-figure",
    brandId: "dc",
    characterId: "batman",
    description: "DC 蝙蝠侠可动人偶，多关节，含斗篷与蝙蝠镖配件。",
    inStock: true,
    scale: "1/12",
    material: "树脂",
    height: "约 15cm",
    name_i18n: {
      en: "Batman 1/12 Action Figure",
      zh: "蝙蝠侠 1/12 可动人偶",
      es: "Figura articulada Batman 1/12",
    },
    description_i18n: {
      en: "DC Batman 1/12 articulated figure with cape and batarang accessories, great for dynamic poses.",
      zh: "DC 蝙蝠侠 1/12 可动人偶，多处关节，附斗篷与蝙蝠镖配件，适合摆出各种动作。",
      es: "Figura articulada de Batman de DC a escala 1/12 con capa y batarangs, ideal para poses dinámicas.",
    },
  },
  {
    id: "6",
    name: "Joker 小丑 1/10 雕像",
    slug: "joker-110-statue",
    price: 399,
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop",
    category: "statue",
    brandId: "dc",
    characterId: "joker",
    description: "小丑主题桌面雕像，精细涂装。",
    inStock: true,
    scale: "1/10",
    material: "树脂",
    height: "约 20cm",
    name_i18n: {
      en: "Joker 1/10 Statue",
      zh: "小丑 1/10 雕像",
      es: "Estatua Joker 1/10",
    },
    description_i18n: {
      en: "Joker themed 1/10 scale statue with expressive sculpt and detailed paint application.",
      zh: "小丑主题 1/10 比例桌面雕像，表情雕刻生动，细节涂装精致。",
      es: "Estatua del Joker a escala 1/10 con esculpido expresivo y pintura detallada.",
    },
  },
  {
    id: "7",
    name: "Knuckles 纳克 1/12 Action Figure",
    slug: "knuckles-112-action-figure",
    price: 249,
    image: "https://images.unsplash.com/photo-1542779283-429940ce8336?w=600&h=800&fit=crop",
    category: "action-figure",
    brandId: "sonic",
    characterId: "knuckles",
    description: "Sonic 系列 Knuckles 可动人偶。",
    inStock: true,
    scale: "1/12",
    material: "树脂",
    height: "约 14cm",
    name_i18n: {
      en: "Knuckles 1/12 Action Figure",
      zh: "纳克 1/12 可动人偶",
      es: "Figura articulada Knuckles 1/12",
    },
    description_i18n: {
      en: "Knuckles 1/12 articulated figure from the Sonic series, compact size for desktop display.",
      zh: "Sonic 系列 Knuckles 1/12 可动人偶，体积小巧，适合桌面摆放。",
      es: "Figura articulada de Knuckles de la serie Sonic a escala 1/12, tamaño compacto para escritorio.",
    },
  },
  {
    id: "8",
    name: "Iron Man 钢铁侠 1/12 预购",
    slug: "iron-man-112-preorder",
    price: 359,
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=800&fit=crop",
    category: "preorder",
    brandId: "marvel",
    characterId: "iron-man",
    description: "钢铁侠 Mark 50 可动人偶，预购截止后约 6 周发货。",
    inStock: false,
    preorder: true,
    preorderEndDate: "2025-05-15",
    scale: "1/12",
    material: "树脂",
    height: "约 15cm",
    name_i18n: {
      en: "Iron Man Mark 50 1/12 (Pre-order)",
      zh: "钢铁侠 Mark 50 1/12 预购",
      es: "Iron Man Mark 50 1/12 (preventa)",
    },
    description_i18n: {
      en: "Iron Man Mark 50 1/12 articulated figure available for pre-order, ships about 6 weeks after cutoff.",
      zh: "钢铁侠 Mark 50 1/12 可动人偶，预购商品，截单后约 6 周发货。",
      es: "Figura articulada de Iron Man Mark 50 a escala 1/12 en preventa, envío unas 6 semanas después del cierre.",
    },
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  if (!category || category === "all") return products;
  return products.filter((p) => p.category === category);
}

export function getProductsByBrand(brand: string): Product[] {
  if (!brand || brand === "all") return products;
  return products.filter((p) => p.brandId === brand);
}

export function getProductsByCharacter(characterId: string): Product[] {
  return products.filter((p) => p.characterId === characterId);
}

export function filterProducts(filters: {
  category?: string;
  brand?: string;
  character?: string;
}): Product[] {
  let result = products;
  if (filters.category && filters.category !== "all") {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.brand && filters.brand !== "all") {
    result = result.filter((p) => p.brandId === filters.brand);
  }
  if (filters.character && filters.character !== "all") {
    result = result.filter((p) => p.characterId === filters.character);
  }
  return result;
}

export function getCharactersByBrand(brandId: BrandId): Character[] {
  return characters.filter((c) => c.brandId === brandId);
}
