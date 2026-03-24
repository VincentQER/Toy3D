// 产品大类：Action Figure 为主
export type CategoryId = "action-figure" | "statue" | "preorder";

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  description?: string;
}

// 品牌 / IP（美漫、游戏等）
export type BrandId =
  | "marvel"
  | "dc"
  | "sonic"
  | "disney"
  | "video-games"
  | "anime"
  | "original";

export interface Brand {
  id: BrandId;
  name: string;
  slug: string;
  description?: string;
}

// 角色（金刚狼、毒液、索尼克等）
export interface Character {
  id: string;
  name: string;
  slug: string;
  brandId: BrandId;
}

// 多语言文案（美国站主用 en，可扩展 zh/es 等）
export interface I18nString {
  en: string;
  zh?: string;
  es?: string;
}

// eBay/Shopify 式变体：一组选项，每个选项可有独立价格与 SKU
export interface ProductVariationOption {
  label: string;   // e.g. "1/12", "Red"
  price: number;   // USD
  sku?: string;
  image?: string;  // 可选：该选项对应图片
}

export interface ProductVariation {
  name: string;    // e.g. "Scale", "Color"
  options: ProductVariationOption[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;                    // 无 variations 时使用；有 variations 时为起售价或占位
  originalPrice?: number;
  image: string;                    // 主图 / 缩略图（兼容旧数据）
  images?: string[];                // 多图：首张即主图，用于详情页图库
  category: CategoryId;
  brandId: BrandId;
  characterId?: string;
  description: string;
  inStock: boolean;
  preorder?: boolean;
  preorderEndDate?: string;
  scale?: string;
  material?: string;
  height?: string;
  // 多语言（美国境内主用 en）
  name_i18n?: I18nString;
  description_i18n?: I18nString;
  // 变体：有则前台显示选项，加购时带选中 variant
  variations?: ProductVariation[];
  // 仅美国境内销售/发货
  domesticOnly?: boolean;
  // 数据来源：default=代码默认，custom=管理员添加
  source?: "default" | "custom";
  /** ISO 时间，用于列表「最新」排序（数据库商品有，静态种子可无） */
  createdAt?: string;
}

// 购物车项：可带选中的变体（价格以 variant 为准）
export interface SelectedVariant {
  variationName: string;
  optionLabel: string;
  price: number;
  sku?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: SelectedVariant;
}
