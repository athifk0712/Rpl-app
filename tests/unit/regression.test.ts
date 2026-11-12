// Test regresi untuk bug yang ditemukan setelah deploy (lihat GitHub Issues). Nomor issue ada di nama describe.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/quote-requests/route";
import { PATCH } from "@/app/api/quote-requests/[id]/route";
import { MAX_QUANTITY, MAX_UNIT_PRICE } from "@/lib/limits";
import { validateStatusChange } from "@/lib/quote-status";
import { parseQuoteInput } from "@/server/quote-service";
import type { QuoteRequest } from "@/types";

const VALID = {
  supplierId: "s04",
  productId: "p11",
  businessName: "Toko Regresi",
  contactName: "Budi",
  phone: "081234567890",
  quantity: 10,
};

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function postQuote(body: unknown) {
  return POST(new NextRequest("http://localhost/api/quote-requests", json(body)));
}

function patchQuote(id: number, body: unknown) {
  return PATCH(new NextRequest(`http://localhost/api/quote-requests/${id}`, { ...json(body), method: "PATCH" }), {
    params: Promise.resolve({ id: String(id) }),
  });
}

describe("#2 — jumlah RFQ punya batas atas", () => {
  it.each([MAX_QUANTITY + 1, 2_147_483_648, 99_999_999_999])("jumlah %d ditolak validasi", (quantity) => {
    expect(parseQuoteInput({ ...VALID, quantity }).errors.quantity).toMatch(/maksimal/);
  });

  it("jumlah tepat di batas diterima", () => {
    expect(parseQuoteInput({ ...VALID, quantity: MAX_QUANTITY }).errors.quantity).toBeUndefined();
  });

  it("API membalas 400 (bukan 500) untuk jumlah yang melebihi INTEGER database", async () => {
    const res = await postQuote({ ...VALID, quantity: 99_999_999_999 });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.quantity).toMatch(/maksimal/);
  });
});

describe("#3 — harga penawaran punya batas atas", () => {
  it.each([MAX_UNIT_PRICE + 1, 2_147_483_648, 99_999_999_999])("harga %d ditolak", (offeredPrice) => {
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice })).toMatchObject({ ok: false, field: "offeredPrice" });
  });

  it("harga tepat di batas diterima", () => {
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice: MAX_UNIT_PRICE }).ok).toBe(true);
  });

  it("API membalas 400 (bukan 500) dan status tidak berubah", async () => {
    const created = (await (await postQuote(VALID)).json()) as QuoteRequest;
    const res = await patchQuote(created.id, { status: "DIBALAS", offeredPrice: 99_999_999_999 });
    expect(res.status).toBe(400);
    const ok = await patchQuote(created.id, { status: "DIBALAS", offeredPrice: 30000 });
    expect(ok.status).toBe(200);
  });
});
