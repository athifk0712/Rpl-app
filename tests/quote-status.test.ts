import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as listQuotes, POST as createQuote } from "@/app/api/quote-requests/route";
import { GET as getQuote, PATCH } from "@/app/api/quote-requests/[id]/route";
import { isFinalStatus, TRANSITIONS, validateStatusChange } from "@/lib/quote-status";
import type { QuoteRequest } from "@/types";

const BASE = "http://localhost/api/quote-requests";

async function newQuote(): Promise<QuoteRequest> {
  const res = await createQuote(
    new NextRequest(BASE, {
      method: "POST",
      body: JSON.stringify({
        supplierId: "s10",
        productId: "p01",
        businessName: "Toko Kue Mawar",
        contactName: "Mawar",
        phone: "081298765432",
        quantity: 200,
      }),
    })
  );
  return res.json();
}

function patch(id: number | string, body: unknown) {
  return PATCH(new NextRequest(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: String(id) }),
  });
}

describe("US5 — memantau & memperbarui status permintaan penawaran", () => {
  it("AC1: alur status BARU → DIBALAS → DITERIMA/DITOLAK, dan pembatalan sebelum status akhir", () => {
    expect(TRANSITIONS.BARU).toEqual(["DIBALAS", "DIBATALKAN"]);
    expect(TRANSITIONS.DIBALAS).toEqual(["DITERIMA", "DITOLAK", "DIBATALKAN"]);
    for (const s of ["DITERIMA", "DITOLAK", "DIBATALKAN"] as const) expect(isFinalStatus(s)).toBe(true);

    expect(validateStatusChange("BARU", { status: "DIBATALKAN" })).toEqual({ ok: true, status: "DIBATALKAN" });
    // UMKM tidak bisa menerima penawaran yang belum dibalas supplier.
    expect(validateStatusChange("BARU", { status: "DITERIMA" })).toMatchObject({ ok: false, conflict: true });
    expect(validateStatusChange("DITOLAK", { status: "DIBALAS", offeredPrice: 1 })).toMatchObject({ ok: false, conflict: true });
    expect(validateStatusChange("BARU", { status: "SELESAI" })).toMatchObject({ ok: false, field: "status" });
  });

  it("AC2: membalas wajib menyertakan harga penawaran bilangan bulat > 0; pesan maks. 500 karakter", () => {
    for (const offeredPrice of [undefined, 0, -100, 99.5, "abc"]) {
      expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice }), String(offeredPrice)).toMatchObject({
        ok: false,
        field: "offeredPrice",
      });
    }
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice: 9500, replyNote: "x".repeat(501) })).toMatchObject({
      ok: false,
      field: "replyNote",
    });
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice: 9500, replyNote: "  Siap kirim  " })).toEqual({
      ok: true,
      status: "DIBALAS",
      offeredPrice: 9500,
      replyNote: "Siap kirim",
    });
  });

  it("AC3: PATCH membalas permintaan menyimpan harga penawaran dan menghitung total penawaran", async () => {
    const quote = await newQuote();
    expect(quote.status).toBe("BARU");

    const res = await patch(quote.id, { status: "DIBALAS", offeredPrice: 9800, replyNote: "Bisa kirim besok" });
    expect(res.status).toBe(200);
    const replied = (await res.json()) as QuoteRequest;
    expect(replied.status).toBe("DIBALAS");
    expect(replied.offeredPrice).toBe(9800);
    expect(replied.offeredTotal).toBe(9800 * 200);
    expect(replied.replyNote).toBe("Bisa kirim besok");

    const accepted = await patch(quote.id, { status: "DITERIMA" });
    expect(accepted.status).toBe(200);
    expect(((await accepted.json()) as QuoteRequest).status).toBe("DITERIMA");
  });

  it("AC4: perubahan yang melanggar alur ditolak 409 dan status di database tidak berubah", async () => {
    const quote = await newQuote();
    await patch(quote.id, { status: "DIBATALKAN" });

    const res = await patch(quote.id, { status: "DIBALAS", offeredPrice: 9000 });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("status akhir");

    const current = await getQuote(new NextRequest(`${BASE}/${quote.id}`), { params: Promise.resolve({ id: String(quote.id) }) });
    expect(((await current.json()) as QuoteRequest).status).toBe("DIBATALKAN");
  });

  it("AC5: id tidak ada → 404, data tidak valid → 400, body bukan JSON → 400", async () => {
    expect((await patch(999999, { status: "DIBATALKAN" })).status).toBe(404);
    expect((await patch("abc", { status: "DIBATALKAN" })).status).toBe(404);

    const quote = await newQuote();
    expect((await patch(quote.id, { status: "DIBALAS" })).status).toBe(400);
    expect((await patch(quote.id, { status: "SELESAI" })).status).toBe(400);

    const notJson = await PATCH(new NextRequest(`${BASE}/${quote.id}`, { method: "PATCH", body: "bukan json" }), {
      params: Promise.resolve({ id: String(quote.id) }),
    });
    expect(notJson.status).toBe(400);
  });

  it("AC6: daftar permintaan bisa difilter per status; status tidak dikenal → 400", async () => {
    const quote = await newQuote();
    await patch(quote.id, { status: "DIBALAS", offeredPrice: 9900 });

    const res = await listQuotes(new NextRequest(`${BASE}?status=DIBALAS`));
    const body = (await res.json()) as { quotes: QuoteRequest[] };
    expect(body.quotes.length).toBeGreaterThan(0);
    expect(body.quotes.every((q) => q.status === "DIBALAS")).toBe(true);
    expect(body.quotes.map((q) => q.id)).toContain(quote.id);

    expect((await listQuotes(new NextRequest(`${BASE}?status=SELESAI`))).status).toBe(400);
  });
});
