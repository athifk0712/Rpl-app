import type { Prisma } from "@/generated/prisma/client";
import { MAX_QUANTITY } from "@/lib/limits";
import { finalPrice } from "@/lib/pricing";
import { isQuoteStatus, validateStatusChange } from "@/lib/quote-status";
import type { QuoteFieldErrors, QuoteRequest, QuoteRequestInput, QuoteStatus } from "@/types";
import { prisma } from "./db";

const PHONE_PATTERN = /^(\+62|62|0)8\d{7,12}$/;
const MAX_NOTE_LENGTH = 500;

const QUOTE_INCLUDE = {
  supplier: { select: { name: true } },
  product: { select: { name: true, unit: true } },
} satisfies Prisma.QuoteRequestInclude;

type QuoteRow = Prisma.QuoteRequestGetPayload<{ include: typeof QUOTE_INCLUDE }>;

export function formatQuoteCode(id: number): string {
  return `RFQ-${String(id).padStart(5, "0")}`;
}

// Nomor WhatsApp disimpan dalam satu format internasional (62…), sama dengan format tautan wa.me.
// 0812…, +62812…, dan 62812… menjadi 62812…. Mengembalikan null jika nomor tidak valid.
export function normalizePhone(raw: string): string | null {
  const compact = raw.replace(/[\s-]/g, "");
  if (!PHONE_PATTERN.test(compact)) return null;
  return compact.replace(/^(\+62|62|0)/, "62");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Validasi bentuk data dari body request (tanpa akses database).
export function parseQuoteInput(body: unknown): { input: QuoteRequestInput; errors: QuoteFieldErrors } {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const input: QuoteRequestInput = {
    supplierId: text(raw.supplierId),
    productId: text(raw.productId),
    businessName: text(raw.businessName),
    contactName: text(raw.contactName),
    phone: text(raw.phone).replace(/[\s-]/g, ""),
    quantity: Number(raw.quantity),
    note: text(raw.note) || undefined,
  };
  const errors: QuoteFieldErrors = {};

  if (!input.supplierId) errors.supplierId = "Supplier wajib dipilih.";
  if (!input.productId) errors.productId = "Pilih produk yang ingin ditanyakan.";
  if (input.businessName.length < 2) errors.businessName = "Nama usaha wajib diisi (minimal 2 karakter).";
  else if (input.businessName.length > 100) errors.businessName = "Nama usaha maksimal 100 karakter.";
  if (input.contactName.length < 2) errors.contactName = "Nama kontak wajib diisi (minimal 2 karakter).";
  else if (input.contactName.length > 100) errors.contactName = "Nama kontak maksimal 100 karakter.";
  const phone = normalizePhone(input.phone);
  if (phone) input.phone = phone;
  else errors.phone = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) errors.quantity = "Jumlah harus bilangan bulat lebih dari 0.";
  else if (input.quantity > MAX_QUANTITY) errors.quantity = `Jumlah maksimal ${MAX_QUANTITY.toLocaleString("id-ID")} per permintaan.`;
  if (input.note && input.note.length > MAX_NOTE_LENGTH) errors.note = `Catatan maksimal ${MAX_NOTE_LENGTH} karakter.`;

  return { input, errors };
}

type CreateResult =
  | { ok: true; quote: QuoteRequest }
  | { ok: false; status: 400 | 404; error: string; fields: QuoteFieldErrors };

// Validasi aturan bisnis yang butuh database: produk dijual supplier, stok, dan minimum order.
export async function createQuoteRequest(body: unknown): Promise<CreateResult> {
  const { input, errors } = parseQuoteInput(body);
  const invalid = (fields: QuoteFieldErrors): CreateResult => ({
    ok: false,
    status: 400,
    error: "Data permintaan penawaran belum valid.",
    fields,
  });

  if (Object.keys(errors).length > 0) return invalid(errors);

  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } });
  if (!supplier) {
    return { ok: false, status: 404, error: "Supplier tidak ditemukan.", fields: { supplierId: "Supplier tidak ditemukan." } };
  }

  const offer = await prisma.supplierProduct.findUnique({
    where: { supplierId_productId: { supplierId: input.supplierId, productId: input.productId } },
    include: { product: true },
  });
  if (!offer) return invalid({ productId: "Produk ini tidak dijual oleh supplier tersebut." });
  if (offer.stock === "habis") return invalid({ productId: `Stok ${offer.product.name} sedang habis.` });
  if (input.quantity < offer.minOrderQty) {
    return invalid({ quantity: `Minimum order ${offer.product.name} adalah ${offer.minOrderQty} ${offer.product.unit}.` });
  }

  const row = await prisma.quoteRequest.create({
    data: {
      supplierId: input.supplierId,
      productId: input.productId,
      businessName: input.businessName,
      contactName: input.contactName,
      phone: input.phone,
      quantity: input.quantity,
      unitPrice: finalPrice({ pricePerUnit: offer.pricePerUnit, discount: offer.discount ?? undefined }),
      note: input.note ?? null,
    },
    include: QUOTE_INCLUDE,
  });
  return { ok: true, quote: toQuote(row) };
}

function toQuote({ supplier, product, createdAt, updatedAt, status, ...row }: QuoteRow): QuoteRequest {
  return {
    ...row,
    code: formatQuoteCode(row.id),
    status: (isQuoteStatus(status) ? status : "BARU") as QuoteStatus,
    supplierName: supplier.name,
    productName: product.name,
    unit: product.unit,
    estimatedTotal: row.unitPrice * row.quantity,
    offeredTotal: row.offeredPrice === null ? null : row.offeredPrice * row.quantity,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export interface QuoteFilter {
  supplierId?: string;
  status?: QuoteStatus;
}

export async function listQuoteRequests({ supplierId, status }: QuoteFilter = {}): Promise<QuoteRequest[]> {
  const rows = await prisma.quoteRequest.findMany({
    where: { ...(supplierId && { supplierId }), ...(status && { status }) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: QUOTE_INCLUDE,
  });
  return rows.map(toQuote);
}

export async function getQuoteRequest(id: number): Promise<QuoteRequest | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = await prisma.quoteRequest.findUnique({ where: { id }, include: QUOTE_INCLUDE });
  return row ? toQuote(row) : null;
}

type UpdateResult = { ok: true; quote: QuoteRequest } | { ok: false; status: 400 | 404 | 409; error: string; field?: string };

// Ubah status RFQ sesuai alur di src/lib/quote-status.ts. Perubahan yang tidak sesuai alur → 409.
export async function updateQuoteStatus(id: number, body: unknown): Promise<UpdateResult> {
  const current = await getQuoteRequest(id);
  if (!current) return { ok: false, status: 404, error: "Permintaan penawaran tidak ditemukan." };

  const change = validateStatusChange(current.status, body);
  if (!change.ok) return { ok: false, status: change.conflict ? 409 : 400, error: change.error, field: change.field };

  // Syarat status lama ikut di WHERE agar dua perubahan bersamaan tidak saling menimpa.
  const { count } = await prisma.quoteRequest.updateMany({
    where: { id, status: current.status },
    data: {
      status: change.status,
      ...(change.offeredPrice !== undefined && { offeredPrice: change.offeredPrice, replyNote: change.replyNote }),
    },
  });
  if (count === 0) return { ok: false, status: 409, error: "Status permintaan baru saja berubah. Muat ulang halaman." };
  return { ok: true, quote: (await getQuoteRequest(id))! };
}
