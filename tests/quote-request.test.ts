import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/quote-requests/route";
import { prisma } from "@/server/db";
import { parseQuoteInput } from "@/server/quote-service";
import type { QuoteRequest, QuoteValidationError } from "@/types";

const VALID = {
  supplierId: "s10",
  productId: "p01",
  businessName: "Roti Bu Sari",
  contactName: "Sari Wulandari",
  phone: "0812-3456-7890",
  quantity: 150,
  note: "Kirim minggu depan",
};

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

async function postInvalid(body: unknown) {
  const res = await post(body);
  return { status: res.status, body: (await res.json()) as QuoteValidationError };
}

beforeAll(async () => {
  await prisma.quoteRequest.deleteMany();
  // Seed tidak punya produk berstok habis, jadi satu penawaran dibuat habis khusus untuk test.
  await prisma.supplierProduct.update({
    where: { supplierId_productId: { supplierId: "s01", productId: "p15" } },
    data: { stock: "habis" },
  });
});

describe("Fitur 2 — permintaan penawaran (RFQ)", () => {
  it("AC1: data valid tersimpan (201) dengan nomor referensi dan estimasi dari harga setelah diskon", async () => {
    const res = await post(VALID);
    expect(res.status).toBe(201);
    const quote = (await res.json()) as QuoteRequest;

    expect(quote.code).toMatch(/^RFQ-\d{5}$/);
    expect(quote.phone).toBe("081234567890");
    expect(quote.unitPrice).toBe(10080);
    expect(quote.estimatedTotal).toBe(10080 * 150);
    expect(quote.status).toBe("BARU");

    const saved = await prisma.quoteRequest.findUnique({ where: { id: quote.id } });
    expect(saved?.businessName).toBe("Roti Bu Sari");
  });

  it("AC2: field wajib dan format nomor WhatsApp divalidasi dengan pesan per field", async () => {
    const { status, body } = await postInvalid({ supplierId: "s10", productId: "", businessName: "", phone: "12345", quantity: 0 });
    expect(status).toBe(400);
    expect(Object.keys(body.fields).sort()).toEqual(["businessName", "contactName", "phone", "productId", "quantity"]);
    expect(body.fields.phone).toContain("Nomor WhatsApp tidak valid");

    for (const phone of ["081234567890", "+6281234567890", "6281234567890"]) {
      expect(parseQuoteInput({ ...VALID, phone }).errors.phone, phone).toBeUndefined();
    }
    for (const phone of ["0212345678", "08123", "abc"]) {
      expect(parseQuoteInput({ ...VALID, phone }).errors.phone, phone).toBeDefined();
    }
  });

  it("AC3: jumlah di bawah minimum order ditolak", async () => {
    const { status, body } = await postInvalid({ ...VALID, quantity: 99 });
    expect(status).toBe(400);
    expect(body.fields.quantity).toBe("Minimum order Tepung Terigu Protein Tinggi adalah 100 kg.");
  });

  it("AC4: produk yang tidak dijual supplier atau stoknya habis ditolak", async () => {
    const notSold = await postInvalid({ ...VALID, productId: "p05" });
    expect(notSold.status).toBe(400);
    expect(notSold.body.fields.productId).toBe("Produk ini tidak dijual oleh supplier tersebut.");

    const soldOut = await postInvalid({ ...VALID, supplierId: "s01", productId: "p15", quantity: 50 });
    expect(soldOut.status).toBe(400);
    expect(soldOut.body.fields.productId).toContain("sedang habis");
  });

  it("AC5: supplier yang tidak ada → 404, body bukan JSON → 400", async () => {
    expect((await postInvalid({ ...VALID, supplierId: "x99" })).status).toBe(404);
    expect((await post("bukan json")).status).toBe(400);
  });

  it("AC6: daftar permintaan terbaru di atas dan bisa difilter per supplier", async () => {
    await post({ ...VALID, supplierId: "s01", productId: "p01", quantity: 30, businessName: "Kedai Kopi Senja" });

    const all = await (await GET(new NextRequest("http://localhost/api/quote-requests"))).json();
    expect(all.total).toBe(2);
    expect(all.quotes[0].businessName).toBe("Kedai Kopi Senja");

    const filtered = await (await GET(new NextRequest("http://localhost/api/quote-requests?supplierId=s10"))).json();
    expect(filtered.quotes.map((q: QuoteRequest) => q.supplierId)).toEqual(["s10"]);
  });
});
