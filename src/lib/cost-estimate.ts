import type { Supplier, SupplierProduct } from "@/types";
import { finalPrice } from "./pricing";

export interface CostEstimateInput {
  supplier: Pick<Supplier, "minOrderValue" | "shippingCost">;
  offer: Pick<SupplierProduct, "pricePerUnit" | "discount" | "minOrderQty" | "stock">;
  quantity: number;
  zone?: string;
}

export interface CostEstimate {
  unitPrice: number;
  subtotal: number;
  savings: number;
  shippingCost: number | null;
  total: number;
  // Alasan pesanan belum memenuhi syarat supplier. Kosong berarti pesanan bisa diajukan.
  issues: string[];
}

// Estimasi biaya pembelian: subtotal setelah diskon + ongkos kirim zona, beserta pengecekan syarat supplier.
export function estimateCost({ supplier, offer, quantity, zone }: CostEstimateInput): CostEstimate {
  const issues: string[] = [];
  const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
  if (qty === 0) issues.push("Jumlah harus bilangan bulat lebih dari 0.");

  const unitPrice = finalPrice(offer);
  const subtotal = unitPrice * qty;
  const savings = (offer.pricePerUnit - unitPrice) * qty;

  let shippingCost: number | null = null;
  if (zone) {
    shippingCost = supplier.shippingCost[zone] ?? null;
    if (shippingCost === null) issues.push("Supplier tidak melayani pengiriman ke zona ini.");
  }

  if (offer.stock === "habis") issues.push("Stok produk sedang habis.");
  if (qty > 0 && qty < offer.minOrderQty) issues.push(`Jumlah di bawah minimum order produk (${offer.minOrderQty}).`);
  if (qty > 0 && subtotal < supplier.minOrderValue) {
    issues.push(`Subtotal di bawah minimum belanja supplier (Rp${supplier.minOrderValue.toLocaleString("id-ID")}).`);
  }

  return { unitPrice, subtotal, savings, shippingCost, total: subtotal + (shippingCost ?? 0), issues };
}

const ZONE_LABELS: Record<string, string> = {
  jabodetabek: "Jabodetabek",
  jawabarat: "Jawa Barat",
  jawa: "Pulau Jawa",
  diy_jateng: "DIY & Jawa Tengah",
  luar_jawa: "Luar Jawa",
};

export function zoneLabel(zone: string): string {
  return ZONE_LABELS[zone] ?? zone.replace(/_/g, " ");
}
