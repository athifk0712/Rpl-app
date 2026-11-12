import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as listSuppliers } from "@/app/api/suppliers/route";
import { GET as getSupplier } from "@/app/api/suppliers/[id]/route";
import { GET as listQuotes } from "@/app/api/quote-requests/route";
import { GET as getQuote } from "@/app/api/quote-requests/[id]/route";
import { CATEGORIES, PROVINCES } from "@/lib/constants";
import type { ApiError, SupplierListResponse } from "@/types";
import { PRODUCTS, SUPPLIERS } from "../../prisma/seed-data";

const request = (path: string) => new NextRequest(new URL(path, "http://localhost"));

async function search(qs: string) {
  const res = await listSuppliers(request(`/api/suppliers?${qs}`));
  return { status: res.status, body: (await res.json()) as SupplierListResponse & ApiError };
}

// Hasil yang diharapkan dihitung langsung dari data seed (sumber kebenaran yang sama dengan database).
function expectedIds({ query = "", category = "", province = "", maxPrice = 0 }) {
  const q = query.trim().toLowerCase();
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

describe("GET /api/suppliers — filter kategori", () => {
  it.each(CATEGORIES)("kategori %s", async (category) => {
    const { status, body } = await search(`category=${encodeURIComponent(category)}`);
    expect(status).toBe(200);
    expect(ids(body.suppliers)).toEqual(expectedIds({ category }));
  });
});

describe("GET /api/suppliers — filter provinsi", () => {
  it.each(PROVINCES)("provinsi %s", async (province) => {
    const { body } = await search(`province=${encodeURIComponent(province)}`);
    expect(ids(body.suppliers)).toEqual(expectedIds({ province }));
  });
});

describe("GET /api/suppliers — harga maksimum", () => {
  it.each([1000, 5000, 10000, 25000, 100000])("maxPrice=%d", async (maxPrice) => {
    const { body } = await search(`maxPrice=${maxPrice}`);
    expect(ids(body.suppliers)).toEqual(expectedIds({ maxPrice }));
  });

  it.each(["-1", "abc", "1e", "Infinity"])("maxPrice=%s ditolak 400", async (maxPrice) => {
    const { status, body } = await search(`maxPrice=${maxPrice}`);
    expect(status).toBe(400);
    expect(body.error).toMatch(/maxPrice/);
  });
});

describe("GET /api/suppliers — kata kunci (huruf sesuai data)", () => {
  it.each(["Tepung", "Kain", "Kemasan", "Bawang Merah", "Bumbu & Rempah", "Jahe", "Botol PET", "Tidak Ada Produk Ini"])(
    "query=%s",
    async (query) => {
      const { body } = await search(`query=${encodeURIComponent(query)}`);
      expect(ids(body.suppliers)).toEqual(expectedIds({ query }));
    }
  );
});

// Regresi issue #1: di Postgres pencarian sempat peka huruf besar/kecil.
describe("GET /api/suppliers — kata kunci tidak peka huruf besar/kecil (#1)", () => {
  it.each(["tepung", "TEPUNG", "tEpUnG", "kain cotton", "STANDING POUCH", "bumbu & rempah", "cv", "  jahe  "])(
    "query=%j sama dengan pencarian huruf sesuai data",
    async (query) => {
      const { body } = await search(`query=${encodeURIComponent(query)}`);
      expect(ids(body.suppliers)).toEqual(expectedIds({ query }));
      if (query.trim() !== "cv") expect(body.suppliers.length).toBeGreaterThan(0);
    }
  );
});

describe("GET /api/suppliers — urutan", () => {
  const sorted = (list: number[], dir: 1 | -1) => [...list].sort((a, b) => dir * (a - b));
  it.each([
    ["rating", (s: SupplierListResponse["suppliers"][number]) => s.rating, -1],
    ["review", (s: SupplierListResponse["suppliers"][number]) => s.reviewCount, -1],
    ["price_asc", (s: SupplierListResponse["suppliers"][number]) => s.minOrderValue, 1],
    ["price_desc", (s: SupplierListResponse["suppliers"][number]) => s.minOrderValue, -1],
  ] as const)("sort=%s", async (sort, key, dir) => {
    const { body } = await search(`sort=${sort}`);
    const values = body.suppliers.map(key);
    expect(values).toEqual(sorted(values, dir));
  });

  it.each(["RATING", "harga", "price", "random"])("sort=%s ditolak 400", async (sort) => {
    expect((await search(`sort=${sort}`)).status).toBe(400);
  });
});

describe("GET /api/suppliers/:id", () => {
  it.each(SUPPLIERS.map((s) => [s.id, s.name]))("%s → %s", async (id, name) => {
    const res = await getSupplier(request(`/api/suppliers/${id}`), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe(name);
  });

  it.each(["s99", "S01", "", "../s01"])("id %j → 404", async (id) => {
    const res = await getSupplier(request(`/api/suppliers/x`), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/quote-requests", () => {
  it.each(["BARU", "DIBALAS", "DITERIMA", "DITOLAK", "DIBATALKAN"])("status=%s → 200, semua hasil berstatus sama", async (status) => {
    const res = await listQuotes(request(`/api/quote-requests?status=${status}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { quotes: { status: string }[] };
    expect(body.quotes.every((q) => q.status === status)).toBe(true);
  });

  it.each(["baru", "SELESAI", "1"])("status=%s → 400", async (status) => {
    expect((await listQuotes(request(`/api/quote-requests?status=${status}`))).status).toBe(400);
  });

  it.each(["0", "-1", "abc", "1.5", "999999"])("GET /api/quote-requests/%s → 404", async (id) => {
    const res = await getQuote(request(`/api/quote-requests/${id}`), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(404);
  });
});
