// Test regresi untuk bug yang ditemukan setelah deploy (lihat GitHub Issues). Nomor issue ada di nama describe.
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/quote-requests/route";
import { PATCH } from "@/app/api/quote-requests/[id]/route";
import { fetchSuppliers, readJson } from "@/lib/api";
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

const html = (status: number) =>
  new Response("<!DOCTYPE html><html><body>Error</body></html>", { status, headers: { "content-type": "text/html" } });
const jsonRes = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("#4 — halaman cari tidak menampilkan error parsing JSON", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([404, 500, 502, 504])("respons HTML %d → pesan ramah dengan kode status", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => html(status)));
    await expect(fetchSuppliers({})).rejects.toThrow(`Server sedang bermasalah (kode ${status})`);
  });

  it("respons 200 tetapi bukan JSON juga ditangani", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => html(200)));
    await expect(fetchSuppliers({})).rejects.not.toThrow(/Unexpected token/);
  });

  it("pesan error dari API (JSON) tetap ditampilkan apa adanya", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonRes(400, { error: "Parameter sort tidak valid." })));
    await expect(fetchSuppliers({ sort: "rating" })).rejects.toThrow("Parameter sort tidak valid.");
  });

  it("respons JSON sukses dikembalikan", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonRes(200, { total: 0, suppliers: [] })));
    await expect(fetchSuppliers({})).resolves.toEqual({ total: 0, suppliers: [] });
  });

  it.each([
    ["application/json", "{rusak", null],
    ["text/plain", "{}", null],
    ["application/json; charset=utf-8", '{"a":1}', { a: 1 }],
  ])("readJson content-type %s body %s → %j", async (type, body, expected) => {
    expect(await readJson(new Response(body, { headers: { "content-type": type } }))).toEqual(expected);
  });
});
