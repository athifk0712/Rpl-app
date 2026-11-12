// Test regresi untuk bug yang ditemukan setelah deploy (lihat GitHub Issues). Nomor issue ada di nama describe.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteUrl } from "@/lib/site";
import { GET as health } from "@/app/api/health/route";
import { prisma } from "@/server/db";
import { currentYear } from "@/lib/utils";
import { POST } from "@/app/api/quote-requests/route";
import { PATCH } from "@/app/api/quote-requests/[id]/route";
import { changeQuoteStatus, fetchSuppliers, readJson, submitQuoteRequest } from "@/lib/api";
import { MAX_QUANTITY, MAX_UNIT_PRICE } from "@/lib/limits";
import { validateStatusChange } from "@/lib/quote-status";
import { normalizePhone, parseQuoteInput } from "@/server/quote-service";
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

describe("#5 — form RFQ membedakan error jaringan dan error server", () => {
  afterEach(() => vi.unstubAllGlobals());
  const input = { ...VALID };

  it("fetch gagal (offline) → pesan koneksi", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect(await submitQuoteRequest(input)).toMatchObject({ ok: false, error: /terhubung/ });
    expect(await changeQuoteStatus(1, { status: "DIBATALKAN" })).toMatchObject({ ok: false, error: /terhubung/ });
  });

  it.each([500, 502, 504])("server membalas HTML %d → pesan server bermasalah, bukan 'periksa koneksi'", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => html(status)));
    const submit = await submitQuoteRequest(input);
    const change = await changeQuoteStatus(1, { status: "DIBATALKAN" });
    for (const r of [submit, change]) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain(`kode ${status}`);
        expect(r.error).not.toMatch(/koneksi/);
      }
    }
  });

  it("error validasi dari API tetap diteruskan beserta pesan per field", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonRes(400, { error: "Data belum valid.", fields: { phone: "Nomor tidak valid." } })));
    expect(await submitQuoteRequest(input)).toEqual({ ok: false, error: "Data belum valid.", fields: { phone: "Nomor tidak valid." } });
  });

  it("sukses → quote dikembalikan", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonRes(201, { id: 7, code: "RFQ-00007" })));
    expect(await submitQuoteRequest(input)).toMatchObject({ ok: true, quote: { id: 7 } });
  });
});

describe("#6 — nomor WhatsApp disimpan dalam satu format (62…)", () => {
  it.each([
    ["081234567890", "6281234567890"],
    ["0812-3456-7890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(["12345", "0712345678", ""])("%j tidak valid → null", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });

  it("format berbeda dari pengguna tersimpan sama di database", async () => {
    const a = (await (await postQuote({ ...VALID, phone: "0812-3456-7890" })).json()) as QuoteRequest;
    const b = (await (await postQuote({ ...VALID, phone: "+6281234567890" })).json()) as QuoteRequest;
    expect(a.phone).toBe("6281234567890");
    expect(b.phone).toBe(a.phone);
  });
});

describe("#7 — fungsi Vercel berjalan di region yang sama dengan database", () => {
  const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { regions?: string[] };
  const dbUrl = readFileSync(".env.example", "utf8");

  it("region fungsi = sin1 (Singapura)", () => {
    expect(vercel.regions).toEqual(["sin1"]);
  });

  it("database Supabase juga di ap-southeast-1 (Singapura)", () => {
    expect(dbUrl).toContain("ap-southeast-1");
  });
});

describe("#8 — header X-Powered-By disembunyikan & security header dipasang", () => {
  it("poweredByHeader dimatikan", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it.each(["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"])(
    "header %s berlaku untuk semua path",
    async (key) => {
      const rules = await nextConfig.headers!();
      const all = rules.find((r) => r.source === "/:path*");
      expect(all?.headers.map((h) => h.key)).toContain(key);
    }
  );
});

describe("#9 — robots.txt & sitemap.xml tersedia", () => {
  it("robots mengizinkan halaman publik, menutup /api/ dan /permintaan", () => {
    const r = robots();
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/", disallow: ["/api/", "/permintaan"] });
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("sitemap berisi halaman publik dengan URL absolut", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toHaveLength(3);
    for (const url of urls) expect(url).toMatch(/^https?:\/\//);
    expect(urls.some((u) => u.includes("/permintaan"))).toBe(false);
  });

  it.each([
    [{ NEXT_PUBLIC_SITE_URL: "https://supplierhub.id/" }, "https://supplierhub.id"],
    [{ VERCEL_PROJECT_PRODUCTION_URL: "supplierhub.vercel.app" }, "https://supplierhub.vercel.app"],
    [{ NEXT_PUBLIC_SITE_URL: "https://a.id", VERCEL_PROJECT_PRODUCTION_URL: "b.vercel.app" }, "https://a.id"],
    [{}, "http://localhost:3000"],
  ])("siteUrl(%j) → %s", (env, expected) => {
    expect(siteUrl(env)).toBe(expected);
  });
});

describe("#10 — endpoint health check", () => {
  afterEach(() => vi.restoreAllMocks());

  it("database terjangkau → 200 status ok", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  it("database gagal → 503 tanpa membocorkan detail error", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("password authentication failed"));
    const res = await health();
    expect(res.status).toBe(503);
    const body = JSON.stringify(await res.json());
    expect(body).toContain("unreachable");
    expect(body).not.toContain("password");
  });
});

describe("#11 — tahun copyright mengikuti tahun berjalan", () => {
  it.each([
    ["2026-11-12T05:00:00Z", 2026],
    ["2027-06-01T00:00:00Z", 2027],
    // 31 Des 18:00 UTC sudah 1 Jan 01:00 WIB.
    ["2026-12-31T18:00:00Z", 2027],
    ["2026-12-31T16:00:00Z", 2026],
  ])("%s → %d", (iso, year) => {
    expect(currentYear(new Date(iso))).toBe(year);
  });

  it("footer tidak lagi menulis tahun 2024 secara tetap", () => {
    const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
    expect(footer).not.toContain("© 2024");
    expect(footer).toContain("currentYear()");
  });
});
