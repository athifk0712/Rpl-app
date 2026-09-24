export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

export interface SupplierProduct {
  productId: string;
  pricePerUnit: number;
  minOrderQty: number;
  stock: "tersedia" | "terbatas" | "habis";
  discount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  city: string;
  province: string;
  phone: string;
  whatsapp: string;
  email: string;
  rating: number;
  reviewCount: number;
  joinedYear: number;
  verified: boolean;
  categories: string[];
  shippingOptions: string[];
  shippingCost: Record<string, number>;
  products: SupplierProduct[];
  responseTime: string;
  minOrderValue: number;
}

export interface CompareItem {
  supplierId: string;
  productId: string;
}

export type SortOption = "price_asc" | "price_desc" | "rating" | "review";
