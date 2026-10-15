import type { SupplierProduct } from "@/types";

// Harga akhir per unit setelah diskon, dibulatkan ke rupiah terdekat.
export function finalPrice(offer: Pick<SupplierProduct, "pricePerUnit" | "discount">): number {
  return Math.round(offer.pricePerUnit * (1 - (offer.discount ?? 0) / 100));
}
