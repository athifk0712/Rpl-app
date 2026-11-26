import { describe, expect, it } from "vitest";
import { estimateCost, zoneLabel } from "@/lib/cost-estimate";
import type { SupplierProduct } from "@/types";

const SUPPLIER = { minOrderValue: 500000, shippingCost: { jabodetabek: 25000, jawa: 65000 } };
const OFFER: Pick<SupplierProduct, "pricePerUnit" | "discount" | "minOrderQty" | "stock"> = {
  pricePerUnit: 11200,
  discount: 10,
  minOrderQty: 100,
  stock: "tersedia",
};

describe("US3 — estimasi biaya pembelian", () => {
  it("AC1: subtotal memakai harga setelah diskon dan menampilkan besar penghematan", () => {
    const r = estimateCost({ supplier: SUPPLIER, offer: OFFER, quantity: 150 });
    expect(r.unitPrice).toBe(10080);
    expect(r.subtotal).toBe(10080 * 150);
    expect(r.savings).toBe((11200 - 10080) * 150);
  });

  it("AC2: total = subtotal + ongkos kirim zona tujuan; tanpa zona berarti tanpa ongkir", () => {
    const withShipping = estimateCost({ supplier: SUPPLIER, offer: OFFER, quantity: 150, zone: "jawa" });
    expect(withShipping.shippingCost).toBe(65000);
    expect(withShipping.total).toBe(1512000 + 65000);
    expect(withShipping.issues).toEqual([]);

    const pickup = estimateCost({ supplier: SUPPLIER, offer: OFFER, quantity: 150 });
    expect(pickup.shippingCost).toBeNull();
    expect(pickup.total).toBe(pickup.subtotal);
  });

  it("AC3: jumlah di bawah minimum order produk diberi peringatan", () => {
    const r = estimateCost({ supplier: SUPPLIER, offer: OFFER, quantity: 99, zone: "jawa" });
    expect(r.issues).toContain("Jumlah di bawah minimum order produk (100).");
  });

  it("AC4: subtotal di bawah minimum belanja supplier diberi peringatan, tepat di batas lolos", () => {
    const cheap = { ...OFFER, pricePerUnit: 1000, discount: undefined, minOrderQty: 1 };
    const below = estimateCost({ supplier: SUPPLIER, offer: cheap, quantity: 499 });
    expect(below.issues.some((i) => i.startsWith("Subtotal di bawah minimum belanja supplier"))).toBe(true);

    const exact = estimateCost({ supplier: SUPPLIER, offer: cheap, quantity: 500 });
    expect(exact.subtotal).toBe(500000);
    expect(exact.issues).toEqual([]);
  });

  it("AC5: zona yang tidak dilayani supplier dan stok habis ditandai", () => {
    const r = estimateCost({ supplier: SUPPLIER, offer: { ...OFFER, stock: "habis" }, quantity: 150, zone: "luar_jawa" });
    expect(r.shippingCost).toBeNull();
    expect(r.issues).toEqual(["Supplier tidak melayani pengiriman ke zona ini.", "Stok produk sedang habis."]);
  });

  it("AC6: jumlah kosong, nol, negatif, atau pecahan tidak dihitung", () => {
    for (const quantity of [0, -5, 2.5, Number.NaN]) {
      const r = estimateCost({ supplier: SUPPLIER, offer: OFFER, quantity });
      expect(r.subtotal, String(quantity)).toBe(0);
      expect(r.issues, String(quantity)).toContain("Jumlah harus bilangan bulat lebih dari 0.");
    }
    expect(zoneLabel("luar_jawa")).toBe("Luar Jawa");
  });
});
