import { describe, expect, it } from "vitest";
import {
  comparableProducts,
  MAX_COMPARE,
  parseCompareIds,
  pickWinners,
  summarizeComparison,
  toggleCompare,
} from "@/lib/compare";
import { finalPrice } from "@/lib/pricing";
import type { Supplier, SupplierProduct } from "@/types";

function offer(productId: string, pricePerUnit: number, extra: Partial<SupplierProduct> = {}): SupplierProduct {
  return {
    productId,
    pricePerUnit,
    minOrderQty: 10,
    stock: "tersedia",
    product: { id: productId, name: productId, category: "Bahan Pangan", unit: "kg", description: "" },
    ...extra,
  };
}

function supplier(id: string, products: SupplierProduct[], extra: Partial<Supplier> = {}): Supplier {
  return {
    id, name: id, logo: "XX", description: "", location: "", city: "", province: "", phone: "", whatsapp: "", email: "",
    rating: 4.5, reviewCount: 100, joinedYear: 2020, verified: true, categories: [], shippingOptions: [], shippingCost: {},
    responseTime: "", minOrderValue: 100000, products, ...extra,
  };
}

describe("US2 — membandingkan supplier", () => {
  it("AC1: maksimal 3 supplier; id kosong, duplikat, dan tidak dikenal di URL diabaikan", () => {
    const known = ["s01", "s02", "s03", "s04"];
    expect(parseCompareIds("s01,s02", known)).toEqual(["s01", "s02"]);
    expect(parseCompareIds("s01,s01, s02,,x99", known)).toEqual(["s01", "s02"]);
    expect(parseCompareIds("s01,s02,s03,s04", known)).toHaveLength(MAX_COMPARE);
    expect(parseCompareIds(null, known)).toEqual([]);
  });

  it("AC2: menambah supplier ke daftar penuh tidak berpengaruh, menekan lagi menghapusnya", () => {
    let list: string[] = [];
    for (const id of ["s01", "s02", "s03", "s04"]) list = toggleCompare(list, id);
    expect(list).toEqual(["s01", "s02", "s03"]);
    expect(toggleCompare(list, "s02")).toEqual(["s01", "s03"]);
  });

  it("AC3: harga dibandingkan setelah diskon (harga akhir = harga × (1 − diskon%), dibulatkan)", () => {
    expect(finalPrice({ pricePerUnit: 11200, discount: 10 })).toBe(10080);
    expect(finalPrice({ pricePerUnit: 12000 })).toBe(12000);
    expect(finalPrice({ pricePerUnit: 12345, discount: 7 })).toBe(11481);

    // Harga dasar A lebih mahal, tetapi setelah diskon 20% justru termurah.
    const a = supplier("A", [offer("p01", 12000, { discount: 20 })]);
    const b = supplier("B", [offer("p01", 10000)]);
    expect(summarizeComparison([a, b], "p01").bestPrice).toEqual(["A"]);
  });

  it("AC4: 'terbaik' hanya ditandai jika ≥2 supplier punya nilai dan nilainya tidak sama semua", () => {
    expect(pickWinners([{ id: "A", value: 5 }, { id: "B", value: 7 }], "min")).toEqual(["A"]);
    expect(pickWinners([{ id: "A", value: 5 }, { id: "B", value: 7 }], "max")).toEqual(["B"]);
    expect(pickWinners([{ id: "A", value: 5 }, { id: "B", value: 5 }], "min")).toEqual([]);
    expect(pickWinners([{ id: "A", value: 5 }, { id: "B", value: null }], "min")).toEqual([]);
    expect(pickWinners([{ id: "A", value: 5 }, { id: "B", value: 5 }, { id: "C", value: 9 }], "min")).toEqual(["A", "B"]);
  });

  it("AC5: supplier yang tidak menjual produk atau stoknya habis tidak dinilai untuk harga produk", () => {
    const a = supplier("A", [offer("p01", 9000, { stock: "habis" })]);
    const b = supplier("B", [offer("p01", 10000)]);
    const c = supplier("C", [offer("p01", 11000)]);
    const d = supplier("D", [offer("p02", 1000)]);
    expect(summarizeComparison([a, b, c, d], "p01").bestPrice).toEqual(["B"]);
    expect(summarizeComparison([a, b], "p01").bestPrice).toEqual([]);
  });

  it("AC6: rating & ulasan tertinggi, minimum belanja terendah; produk diurutkan dari yang paling banyak dijual", () => {
    const a = supplier("A", [offer("p01", 1), offer("p02", 1)], { rating: 4.9, reviewCount: 50, minOrderValue: 500000 });
    const b = supplier("B", [offer("p02", 1)], { rating: 4.5, reviewCount: 300, minOrderValue: 200000 });
    const summary = summarizeComparison([a, b], "p02");
    expect(summary.bestRating).toEqual(["A"]);
    expect(summary.bestReviews).toEqual(["B"]);
    expect(summary.bestMinOrderValue).toEqual(["B"]);
    expect(comparableProducts([a, b])).toEqual(["p02", "p01"]);
  });
});
