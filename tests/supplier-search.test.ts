import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as listSuppliers } from "@/app/api/suppliers/route";
import { GET as getSupplier } from "@/app/api/suppliers/[id]/route";
import { searchSuppliers } from "@/server/supplier-service";
import type { SupplierListResponse } from "@/types";
import { PRODUCTS, SUPPLIERS } from "../prisma/seed-data";

// Logika pencarian versi 1 (mock data) dipakai sebagai pembanding hasil dari database.
function expectedIds(query = "", category = "", province = "", maxPrice = 0) {
  const q = query.toLowerCase();
  return SUPPLIERS.filter((s) => {
    const offers = s.products.map((sp) => ({ ...sp, product: PRODUCTS.find((p) => p.id === sp.productId)! }));
    return (
      (!category || s.categories.includes(category)) &&
      (!province || s.province === province) &&
      (!maxPrice || offers.some((o) => o.pricePerUnit <= maxPrice)) &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        offers.some((o) => o.product.name.toLowerCase().includes(q) || o.product.category.toLowerCase().includes(q)))
    );
  })
    .map((s) => s.id)
    .sort();
}

const ids = (list: { id: string }[]) => list.map((s) => s.id).sort();

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost"));
}

describe("Fitur 1 — pencarian supplier dari database", () => {
  it("AC1: tanpa filter mengembalikan semua supplier hasil seed beserta produknya", async () => {
    const result = await searchSuppliers();
    expect(result).toHaveLength(SUPPLIERS.length);
    const s01 = result.find((s) => s.id === "s01")!;
    expect(s01.products[0].product.name).toBe("Tepung Terigu Protein Tinggi");
    expect(s01.shippingCost).toEqual(SUPPLIERS[0].shippingCost);
  });

  it("AC2: kata kunci cocok dengan nama supplier, nama produk, atau kategori (tidak peka huruf besar)", async () => {
    for (const q of ["tepung", "TEPUNG", "Kain", "kemasan", "Sumber Makmur"]) {
      expect(ids(await searchSuppliers({ query: q })), q).toEqual(expectedIds(q));
    }
    expect(await searchSuppliers({ query: "tepung" })).not.toHaveLength(0);
  });

  it("AC3: filter kategori, provinsi, dan harga maksimum digabung (AND)", async () => {
    const cases: [string, string, string, number][] = [
      ["", "Bahan Pangan", "", 0],
      ["", "", "Jawa Timur", 0],
      ["", "", "", 10000],
      ["tepung", "Bahan Pangan", "Jawa Barat", 13000],
    ];
    for (const [query, category, province, maxPrice] of cases) {
      const result = await searchSuppliers({ query, category, province, maxPrice });
      expect(ids(result), JSON.stringify({ query, category, province, maxPrice })).toEqual(
        expectedIds(query, category, province, maxPrice)
      );
    }
  });

  it("AC4: hasil diurutkan sesuai parameter sort", async () => {
    const byRating = await searchSuppliers({ sort: "rating" });
    expect(byRating.map((s) => s.rating)).toEqual([...byRating.map((s) => s.rating)].sort((a, b) => b - a));
    const byMinOrder = await searchSuppliers({ sort: "price_asc" });
    expect(byMinOrder.map((s) => s.minOrderValue)).toEqual(
      [...byMinOrder.map((s) => s.minOrderValue)].sort((a, b) => a - b)
    );
  });

  it("AC5: GET /api/suppliers mengembalikan JSON dan memvalidasi parameter", async () => {
    const ok = await listSuppliers(request("/api/suppliers?query=tepung&sort=review"));
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as SupplierListResponse;
    expect(body.total).toBe(body.suppliers.length);
    expect(ids(body.suppliers)).toEqual(expectedIds("tepung"));

    const badSort = await listSuppliers(request("/api/suppliers?sort=termurah"));
    expect(badSort.status).toBe(400);
    expect((await badSort.json()).error).toContain("sort tidak valid");

    const badPrice = await listSuppliers(request("/api/suppliers?maxPrice=abc"));
    expect(badPrice.status).toBe(400);
  });

  it("AC6: GET /api/suppliers/:id mengembalikan detail, 404 jika tidak ada", async () => {
    const ok = await getSupplier(request("/api/suppliers/s01"), { params: Promise.resolve({ id: "s01" }) });
    expect(ok.status).toBe(200);
    expect((await ok.json()).name).toBe("UD Sumber Makmur");

    const missing = await getSupplier(request("/api/suppliers/x99"), { params: Promise.resolve({ id: "x99" }) });
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toBe('Supplier dengan id "x99" tidak ditemukan.');
  });
});
