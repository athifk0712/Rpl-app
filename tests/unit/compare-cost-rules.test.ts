import { describe, expect, it } from "vitest";
import { comparableProducts, MAX_COMPARE, parseCompareIds, pickWinners, summarizeComparison, toggleCompare } from "@/lib/compare";
import { estimateCost } from "@/lib/cost-estimate";
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

const KNOWN = ["s01", "s02", "s03", "s04", "s05"];

describe("parseCompareIds — parameter ?ids= halaman bandingkan", () => {
  it.each([
    [null, []],
    [undefined, []],
    ["", []],
    ["s01", ["s01"]],
    ["s01,s02", ["s01", "s02"]],
    [" s01 , s02 ", ["s01", "s02"]],
    ["s01,s01,s02", ["s01", "s02"]],
    ["s01,,s02,", ["s01", "s02"]],
    ["s01,zzz,s02", ["s01", "s02"]],
    ["s01,s02,s03,s04,s05", ["s01", "s02", "s03"]],
    ["S01", []],
    ["zzz", []],
  ])("ids=%j → %j", (raw, expected) => {
    expect(parseCompareIds(raw, KNOWN)).toEqual(expected);
  });
});

describe("toggleCompare — tombol tambah/hapus bandingkan", () => {
  it.each([
    [[], "s01", ["s01"]],
    [["s01"], "s02", ["s01", "s02"]],
    [["s01", "s02"], "s01", ["s02"]],
    [["s01", "s02", "s03"], "s04", ["s01", "s02", "s03"]],
    [["s01", "s02", "s03"], "s02", ["s01", "s03"]],
  ])("%j + %s → %j", (list, id, expected) => {
    expect(toggleCompare(list, id)).toEqual(expected);
  });

  it(`daftar tidak pernah lebih dari ${MAX_COMPARE}`, () => {
    let list: string[] = [];
    for (const id of KNOWN) list = toggleCompare(list, id);
    expect(list).toHaveLength(MAX_COMPARE);
  });
});

describe("pickWinners — penanda nilai terbaik", () => {
  const e = (...values: (number | null)[]) => values.map((value, i) => ({ id: `s${i + 1}`, value }));
  it.each([
    [e(100, 200), "min", ["s1"]],
    [e(100, 200), "max", ["s2"]],
    [e(100, 100, 200), "min", ["s1", "s2"]],
    [e(100, 100), "min", []],
    [e(100), "min", []],
    [e(), "max", []],
    [e(null, 100), "min", []],
    [e(null, 100, 50), "min", ["s3"]],
    [e(4.8, 4.9, 4.9), "max", ["s2", "s3"]],
    [e(0, 5), "min", ["s1"]],
  ] as const)("%j (%s) → %j", (entries, mode, expected) => {
    expect(pickWinners([...entries], mode)).toEqual(expected);
  });
});

describe("comparableProducts & summarizeComparison", () => {
  const a = supplier("a", [offer("p01", 10000, { discount: 10 }), offer("p02", 5000)], { rating: 4.9, reviewCount: 50, minOrderValue: 300000 });
  const b = supplier("b", [offer("p01", 9500), offer("p03", 7000)], { rating: 4.5, reviewCount: 500, minOrderValue: 200000 });
  const c = supplier("c", [offer("p01", 8000, { stock: "habis" }), offer("p02", 4000, { minOrderQty: 5 })], { rating: 4.5, reviewCount: 100, minOrderValue: 200000 });

  it("produk yang dijual paling banyak supplier di urutan pertama", () => {
    expect(comparableProducts([a, b, c])).toEqual(["p01", "p02", "p03"]);
  });

  it("tanpa supplier → tidak ada produk", () => {
    expect(comparableProducts([])).toEqual([]);
  });

  it.each([
    ["p01", "bestPrice", ["a"]],
    ["p02", "bestPrice", ["c"]],
    ["p03", "bestPrice", []],
    ["p02", "bestMinOrderQty", ["c"]],
    ["p01", "bestMinOrderQty", []],
    ["p01", "bestRating", ["a"]],
    ["p01", "bestReviews", ["b"]],
    ["p01", "bestMinOrderValue", ["b", "c"]],
  ] as const)("produk %s → %s = %j", (productId, key, expected) => {
    expect(summarizeComparison([a, b, c], productId)[key]).toEqual(expected);
  });
});

describe("estimateCost — estimasi biaya", () => {
  const SUP = { minOrderValue: 500000, shippingCost: { jabodetabek: 25000, jawa: 65000 } };
  const OFFER = { pricePerUnit: 11200, discount: 10, minOrderQty: 100, stock: "tersedia" as const };

  it.each([
    [100, 1008000, 112000],
    [150, 1512000, 168000],
    [1000, 10080000, 1120000],
  ])("jumlah %d → subtotal %d, hemat %d", (quantity, subtotal, savings) => {
    const r = estimateCost({ supplier: SUP, offer: OFFER, quantity });
    expect(r).toMatchObject({ unitPrice: 10080, subtotal, savings, issues: [] });
  });

  it.each([0, -5, 1.5, NaN])("jumlah %d tidak dihitung", (quantity) => {
    const r = estimateCost({ supplier: SUP, offer: OFFER, quantity });
    expect(r.subtotal).toBe(0);
    expect(r.issues).toContain("Jumlah harus bilangan bulat lebih dari 0.");
  });

  it.each([
    [undefined, null, 1008000],
    ["jabodetabek", 25000, 1033000],
    ["jawa", 65000, 1073000],
  ])("zona %s → ongkir %s, total %d", (zone, shippingCost, total) => {
    const r = estimateCost({ supplier: SUP, offer: OFFER, quantity: 100, zone });
    expect(r.shippingCost).toBe(shippingCost);
    expect(r.total).toBe(total);
  });

  it.each(["luar_jawa", "bali"])("zona %s tidak dilayani", (zone) => {
    expect(estimateCost({ supplier: SUP, offer: OFFER, quantity: 100, zone }).issues).toContain(
      "Supplier tidak melayani pengiriman ke zona ini."
    );
  });

  it.each([
    [99, true],
    [100, false],
  ])("jumlah %d di bawah minimum order = %s", (quantity, below) => {
    const issues = estimateCost({ supplier: SUP, offer: OFFER, quantity }).issues;
    expect(issues.some((i) => i.includes("minimum order"))).toBe(below);
  });

  it.each([
    [49, true],
    [50, false],
  ])("subtotal dari %d unit di bawah minimum belanja = %s", (quantity, below) => {
    const issues = estimateCost({ supplier: SUP, offer: { ...OFFER, discount: undefined, pricePerUnit: 10000, minOrderQty: 1 }, quantity }).issues;
    expect(issues.some((i) => i.includes("minimum belanja"))).toBe(below);
  });

  it("stok habis selalu ditandai", () => {
    expect(estimateCost({ supplier: SUP, offer: { ...OFFER, stock: "habis" }, quantity: 100 }).issues).toContain("Stok produk sedang habis.");
  });
});
