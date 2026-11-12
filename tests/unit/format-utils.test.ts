import { describe, expect, it } from "vitest";
import { cn, formatNumber, formatRupiah, getStockBadgeClass, getStockLabel, renderStars } from "@/lib/utils";
import { finalPrice } from "@/lib/pricing";
import { zoneLabel } from "@/lib/cost-estimate";
import { formatQuoteCode } from "@/server/quote-service";

// Intl memakai spasi tak-putus (U+00A0) antara "Rp" dan angka; dinormalkan agar mudah dibandingkan.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatRupiah — format mata uang rupiah", () => {
  it.each([
    [0, "Rp 0"],
    [500, "Rp 500"],
    [10000, "Rp 10.000"],
    [1250000, "Rp 1.250.000"],
    [999999999, "Rp 999.999.999"],
    [10080.4, "Rp 10.080"],
    [10080.6, "Rp 10.081"],
  ])("formatRupiah(%d) → %s", (amount, expected) => {
    expect(plain(formatRupiah(amount))).toBe(expected);
  });
});

describe("formatNumber — pemisah ribuan Indonesia", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1.000"],
    [1234567, "1.234.567"],
  ])("formatNumber(%d) → %s", (n, expected) => {
    expect(formatNumber(n)).toBe(expected);
  });
});

describe("label & warna stok", () => {
  it.each([
    ["tersedia", "Stok Tersedia", "green"],
    ["terbatas", "Stok Terbatas", "yellow"],
    ["habis", "Stok Habis", "red"],
    ["pre-order", "pre-order", "gray"],
  ])("stok %s → label %s, warna %s", (stock, label, color) => {
    expect(getStockLabel(stock)).toBe(label);
    expect(getStockBadgeClass(stock)).toContain(`bg-${color}-100`);
  });
});

describe("renderStars — bintang rating", () => {
  it.each([
    [5, "★★★★★"],
    [4, "★★★★☆"],
    [4.5, "★★★★½"],
    [4.4, "★★★★☆"],
    [3.7, "★★★½☆"],
    [1, "★☆☆☆☆"],
    [0, "☆☆☆☆☆"],
  ])("renderStars(%d) → %s", (rating, expected) => {
    expect(renderStars(rating)).toBe(expected);
  });

  it.each([0, 0.5, 1.2, 2.5, 3.9, 4.8, 5])("selalu 5 simbol untuk rating %d", (rating) => {
    expect([...renderStars(rating)]).toHaveLength(5);
  });
});

describe("cn — menggabungkan class CSS", () => {
  it.each([
    [["a", "b"], "a b"],
    [["a", false, "b"], "a b"],
    [["a", undefined, null, "c"], "a c"],
    [[false, null, undefined], ""],
  ] as const)("cn(%j) → %j", (classes, expected) => {
    expect(cn(...classes)).toBe(expected);
  });
});

describe("finalPrice — harga setelah diskon", () => {
  it.each([
    [10000, undefined, 10000],
    [10000, 0, 10000],
    [10000, 10, 9000],
    [11200, 10, 10080],
    [12345, 15, 10493],
    [999, 50, 500],
    [1000, 100, 0],
    [33333, 33, 22333],
    [1, 1, 1],
  ])("harga %d diskon %s%% → %d", (pricePerUnit, discount, expected) => {
    expect(finalPrice({ pricePerUnit, discount })).toBe(expected);
  });

  it("hasil selalu bilangan bulat rupiah", () => {
    for (let d = 0; d <= 100; d += 7) expect(Number.isInteger(finalPrice({ pricePerUnit: 12345, discount: d }))).toBe(true);
  });
});

describe("zoneLabel — nama zona pengiriman", () => {
  it.each([
    ["jabodetabek", "Jabodetabek"],
    ["jawabarat", "Jawa Barat"],
    ["jawa", "Pulau Jawa"],
    ["diy_jateng", "DIY & Jawa Tengah"],
    ["luar_jawa", "Luar Jawa"],
    ["bali_nusra", "bali nusra"],
  ])("zona %s → %s", (zone, label) => {
    expect(zoneLabel(zone)).toBe(label);
  });
});

describe("formatQuoteCode — nomor referensi RFQ", () => {
  it.each([
    [1, "RFQ-00001"],
    [42, "RFQ-00042"],
    [12345, "RFQ-12345"],
    [123456, "RFQ-123456"],
  ])("id %d → %s", (id, code) => {
    expect(formatQuoteCode(id)).toBe(code);
  });
});
