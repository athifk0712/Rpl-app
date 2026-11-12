import { describe, expect, it } from "vitest";
import {
  isFinalStatus,
  isQuoteStatus,
  MAX_REPLY_LENGTH,
  QUOTE_STATUSES,
  TRANSITIONS,
  validateStatusChange,
} from "@/lib/quote-status";
import { parseQuoteInput } from "@/server/quote-service";
import type { QuoteStatus } from "@/types";

const VALID = {
  supplierId: "s10",
  productId: "p01",
  businessName: "Roti Bu Sari",
  contactName: "Sari Wulandari",
  phone: "081234567890",
  quantity: 150,
};

const ALLOWED: [QuoteStatus, QuoteStatus][] = [
  ["BARU", "DIBALAS"],
  ["BARU", "DIBATALKAN"],
  ["DIBALAS", "DITERIMA"],
  ["DIBALAS", "DITOLAK"],
  ["DIBALAS", "DIBATALKAN"],
];
const isAllowed = (from: QuoteStatus, to: QuoteStatus) => ALLOWED.some(([f, t]) => f === from && t === to);
const ALL_PAIRS = QUOTE_STATUSES.flatMap((from) => QUOTE_STATUSES.map((to) => [from, to] as [QuoteStatus, QuoteStatus]));

describe("status RFQ — semua 25 kombinasi perpindahan", () => {
  it.each(ALL_PAIRS)("%s → %s", (from, to) => {
    const body = to === "DIBALAS" ? { status: to, offeredPrice: 10000 } : { status: to };
    const result = validateStatusChange(from, body);
    expect(result.ok).toBe(isAllowed(from, to));
    if (!result.ok) {
      expect(result.conflict).toBe(true);
      expect(result.field).toBe("status");
    }
  });
});

describe("status RFQ — status akhir & pengenalan status", () => {
  it.each([
    ["BARU", false],
    ["DIBALAS", false],
    ["DITERIMA", true],
    ["DITOLAK", true],
    ["DIBATALKAN", true],
  ] as const)("isFinalStatus(%s) = %s", (status, final) => {
    expect(isFinalStatus(status)).toBe(final);
    expect(TRANSITIONS[status].length === 0).toBe(final);
  });

  it.each([...QUOTE_STATUSES])("isQuoteStatus(%s) = true", (status) => {
    expect(isQuoteStatus(status)).toBe(true);
  });

  it.each(["baru", "Dibalas", "SELESAI", "", " BARU", null, undefined, 1, {}])("isQuoteStatus(%j) = false", (value) => {
    expect(isQuoteStatus(value)).toBe(false);
  });

  it.each([null, undefined, "DIBALAS", [], {}, { status: "selesai" }])("body %j ditolak sebagai status tidak valid (400)", (body) => {
    const result = validateStatusChange("BARU", body);
    expect(result).toMatchObject({ ok: false, field: "status" });
    if (!result.ok) expect(result.conflict).toBeUndefined();
  });
});

describe("status RFQ — harga penawaran saat membalas", () => {
  it.each([1, 100, 10080, "25000"])("harga %j diterima", (offeredPrice) => {
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice })).toMatchObject({
      ok: true,
      offeredPrice: Number(offeredPrice),
    });
  });

  it.each([undefined, null, "", 0, -500, 99.5, "abc", NaN, Infinity])("harga %j ditolak", (offeredPrice) => {
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice })).toMatchObject({ ok: false, field: "offeredPrice" });
  });

  it.each([
    ["", null],
    ["   ", null],
    ["  Siap kirim besok  ", "Siap kirim besok"],
    ["x".repeat(MAX_REPLY_LENGTH), "x".repeat(MAX_REPLY_LENGTH)],
  ])("pesan balasan %j disimpan sebagai %j", (replyNote, expected) => {
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice: 1000, replyNote })).toMatchObject({
      ok: true,
      replyNote: expected,
    });
  });

  it("pesan balasan lebih dari batas ditolak", () => {
    const replyNote = "x".repeat(MAX_REPLY_LENGTH + 1);
    expect(validateStatusChange("BARU", { status: "DIBALAS", offeredPrice: 1000, replyNote })).toMatchObject({
      ok: false,
      field: "replyNote",
    });
  });
});

describe("validasi form RFQ — nomor WhatsApp", () => {
  it.each([
    ["081234567890", "081234567890"],
    ["0812-3456-7890", "081234567890"],
    ["0812 3456 7890", "081234567890"],
    ["6281234567890", "6281234567890"],
    ["+6281234567890", "+6281234567890"],
    ["08123456789", "08123456789"],
    ["08571234567890", "08571234567890"],
  ])("%s valid (disimpan sebagai %s)", (phone, stored) => {
    const { input, errors } = parseQuoteInput({ ...VALID, phone });
    expect(errors.phone).toBeUndefined();
    expect(input.phone).toBe(stored);
  });

  it.each(["", "12345", "0712345678", "081234", "08123456789012345", "62-0812345678", "abcdefghijk", "0812345678a", "+1 555 1234567"])(
    "%j tidak valid",
    (phone) => {
      expect(parseQuoteInput({ ...VALID, phone }).errors.phone).toBeDefined();
    }
  );
});

describe("validasi form RFQ — nama usaha, kontak, jumlah, catatan", () => {
  it.each([
    ["", false],
    ["A", false],
    ["  A  ", false],
    ["AB", true],
    ["x".repeat(100), true],
    ["x".repeat(101), false],
  ])("nama usaha %j valid = %s", (businessName, valid) => {
    expect(parseQuoteInput({ ...VALID, businessName }).errors.businessName === undefined).toBe(valid);
  });

  it.each([
    ["", false],
    ["B", false],
    ["Bu", true],
    ["x".repeat(100), true],
    ["x".repeat(101), false],
  ])("nama kontak %j valid = %s", (contactName, valid) => {
    expect(parseQuoteInput({ ...VALID, contactName }).errors.contactName === undefined).toBe(valid);
  });

  it.each([1, 10, 150, "200"])("jumlah %j valid", (quantity) => {
    expect(parseQuoteInput({ ...VALID, quantity }).errors.quantity).toBeUndefined();
  });

  it.each([0, -1, 1.5, "", "abc", null, undefined])("jumlah %j tidak valid", (quantity) => {
    expect(parseQuoteInput({ ...VALID, quantity }).errors.quantity).toBeDefined();
  });

  it.each([
    [undefined, undefined, true],
    ["", undefined, true],
    ["   ", undefined, true],
    ["  Kirim pagi  ", "Kirim pagi", true],
    ["x".repeat(500), "x".repeat(500), true],
    ["x".repeat(501), "x".repeat(501), false],
  ])("catatan %j → %j (valid = %s)", (note, stored, valid) => {
    const { input, errors } = parseQuoteInput({ ...VALID, note });
    expect(input.note).toBe(stored);
    expect(errors.note === undefined).toBe(valid);
  });

  it.each(["supplierId", "productId"] as const)("%s kosong ditolak", (field) => {
    expect(parseQuoteInput({ ...VALID, [field]: "  " }).errors[field]).toBeDefined();
  });

  it.each([null, undefined, "teks", 42, []])("body %j → semua field wajib dilaporkan", (body) => {
    const { errors } = parseQuoteInput(body);
    expect(Object.keys(errors).sort()).toEqual(["businessName", "contactName", "phone", "productId", "quantity", "supplierId"]);
  });

  it("nilai bukan string (angka, objek) dianggap kosong, bukan error server", () => {
    const { errors } = parseQuoteInput({ ...VALID, businessName: 12345, contactName: { name: "x" } });
    expect(errors.businessName).toBeDefined();
    expect(errors.contactName).toBeDefined();
  });
});
