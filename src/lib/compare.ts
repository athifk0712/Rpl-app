import type { Supplier } from "@/types";
import { finalPrice } from "./pricing";

export const MAX_COMPARE = 3;
export const MIN_COMPARE = 2;

// Ubah parameter `?ids=` menjadi daftar supplier yang dibandingkan:
// id kosong, duplikat, atau tidak dikenal diabaikan, dan maksimal MAX_COMPARE supplier.
export function parseCompareIds(raw: string | null | undefined, knownIds: string[]): string[] {
  const known = new Set(knownIds);
  const ids = (raw ?? "").split(",").map((id) => id.trim()).filter((id) => known.has(id));
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}

// Tambah/hapus supplier dari daftar perbandingan. Jika daftar sudah penuh, supplier baru tidak ditambahkan.
export function toggleCompare(list: string[], id: string): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length < MAX_COMPARE ? [...list, id] : list;
}

// Produk yang dijual supplier terpilih, diurutkan dari yang dijual paling banyak supplier (paling bisa dibandingkan).
export function comparableProducts(suppliers: Supplier[]): string[] {
  const count = new Map<string, number>();
  for (const s of suppliers) for (const p of s.products) count.set(p.productId, (count.get(p.productId) ?? 0) + 1);
  return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b));
}

// Id supplier dengan nilai terbaik. Kosong jika kurang dari 2 supplier punya nilai, atau semua nilainya sama.
export function pickWinners(entries: { id: string; value: number | null }[], mode: "min" | "max"): string[] {
  const valid = entries.filter((e): e is { id: string; value: number } => e.value !== null);
  if (valid.length < MIN_COMPARE) return [];
  const values = valid.map((e) => e.value);
  const best = mode === "min" ? Math.min(...values) : Math.max(...values);
  const winners = valid.filter((e) => e.value === best).map((e) => e.id);
  return winners.length === valid.length ? [] : winners;
}

export interface CompareSummary {
  bestPrice: string[];
  bestMinOrderQty: string[];
  bestMinOrderValue: string[];
  bestRating: string[];
  bestReviews: string[];
}

// Supplier terbaik per kriteria untuk satu produk. Supplier yang tidak menjual produk itu, atau stoknya habis,
// tidak ikut dinilai untuk harga dan minimum order produk.
export function summarizeComparison(suppliers: Supplier[], productId: string): CompareSummary {
  const offerOf = (s: Supplier) => s.products.find((p) => p.productId === productId && p.stock !== "habis");
  return {
    bestPrice: pickWinners(suppliers.map((s) => ({ id: s.id, value: offerOf(s) ? finalPrice(offerOf(s)!) : null })), "min"),
    bestMinOrderQty: pickWinners(suppliers.map((s) => ({ id: s.id, value: offerOf(s)?.minOrderQty ?? null })), "min"),
    bestMinOrderValue: pickWinners(suppliers.map((s) => ({ id: s.id, value: s.minOrderValue })), "min"),
    bestRating: pickWinners(suppliers.map((s) => ({ id: s.id, value: s.rating })), "max"),
    bestReviews: pickWinners(suppliers.map((s) => ({ id: s.id, value: s.reviewCount })), "max"),
  };
}
