export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

export type Stock = "tersedia" | "terbatas" | "habis";

export interface SupplierProduct {
  productId: string;
  pricePerUnit: number;
  minOrderQty: number;
  stock: Stock;
  discount?: number;
  product: Product;
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

export interface SupplierSearchParams {
  query?: string;
  category?: string;
  province?: string;
  maxPrice?: number;
  sort?: SortOption;
}

export interface SupplierListResponse {
  total: number;
  suppliers: Supplier[];
}

export interface ApiError {
  error: string;
}

export interface QuoteRequestInput {
  supplierId: string;
  productId: string;
  businessName: string;
  contactName: string;
  phone: string;
  quantity: number;
  note?: string;
}

export type QuoteField = keyof QuoteRequestInput;

export type QuoteFieldErrors = Partial<Record<QuoteField, string>>;

export type QuoteStatus = "BARU" | "DIBALAS" | "DITERIMA" | "DITOLAK" | "DIBATALKAN";

export interface QuoteRequest {
  id: number;
  code: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  unit: string;
  businessName: string;
  contactName: string;
  phone: string;
  quantity: number;
  unitPrice: number;
  estimatedTotal: number;
  note: string | null;
  status: QuoteStatus;
  offeredPrice: number | null;
  offeredTotal: number | null;
  replyNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteStatusUpdate {
  status: QuoteStatus;
  offeredPrice?: number;
  replyNote?: string;
}

export interface QuoteValidationError extends ApiError {
  fields: QuoteFieldErrors;
}
