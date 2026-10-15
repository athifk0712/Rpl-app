import type { QuoteStatus } from "@/types";

export const QUOTE_STATUSES: readonly QuoteStatus[] = ["BARU", "DIBALAS", "DITERIMA", "DITOLAK", "DIBATALKAN"];

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  BARU: "Baru",
  DIBALAS: "Dibalas supplier",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
  DIBATALKAN: "Dibatalkan",
};

// Alur status RFQ:
//   BARU ──(supplier membalas dengan harga)──▶ DIBALAS ──(UMKM)──▶ DITERIMA / DITOLAK
//   BARU / DIBALAS ──(UMKM membatalkan)──▶ DIBATALKAN
// DITERIMA, DITOLAK, dan DIBATALKAN adalah status akhir.
export const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  BARU: ["DIBALAS", "DIBATALKAN"],
  DIBALAS: ["DITERIMA", "DITOLAK", "DIBATALKAN"],
  DITERIMA: [],
  DITOLAK: [],
  DIBATALKAN: [],
};

export const MAX_REPLY_LENGTH = 500;

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && QUOTE_STATUSES.includes(value as QuoteStatus);
}

export function isFinalStatus(status: QuoteStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export type StatusChange =
  | { ok: true; status: QuoteStatus; offeredPrice?: number; replyNote?: string | null }
  // conflict: data valid tetapi perpindahan status tidak diizinkan dari status saat ini.
  | { ok: false; error: string; field: "status" | "offeredPrice" | "replyNote"; conflict?: boolean };

// Validasi perubahan status tanpa akses database. Saat membalas (DIBALAS), supplier wajib mengisi harga penawaran.
export function validateStatusChange(current: QuoteStatus, body: unknown): StatusChange {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const next = raw.status;

  if (!isQuoteStatus(next)) {
    return { ok: false, field: "status", error: `Status tidak valid. Gunakan salah satu: ${QUOTE_STATUSES.join(", ")}.` };
  }
  if (!TRANSITIONS[current].includes(next)) {
    const reason = isFinalStatus(current) ? `sudah ${STATUS_LABEL[current].toLowerCase()} (status akhir)` : `berstatus ${current}`;
    return { ok: false, field: "status", conflict: true, error: `Permintaan ${reason}, tidak bisa diubah menjadi ${next}.` };
  }
  if (next !== "DIBALAS") return { ok: true, status: next };

  const offeredPrice = Number(raw.offeredPrice);
  if (!Number.isInteger(offeredPrice) || offeredPrice <= 0) {
    return { ok: false, field: "offeredPrice", error: "Harga penawaran per unit wajib diisi (bilangan bulat lebih dari 0)." };
  }
  const replyNote = typeof raw.replyNote === "string" ? raw.replyNote.trim() : "";
  if (replyNote.length > MAX_REPLY_LENGTH) {
    return { ok: false, field: "replyNote", error: `Pesan balasan maksimal ${MAX_REPLY_LENGTH} karakter.` };
  }
  return { ok: true, status: next, offeredPrice, replyNote: replyNote || null };
}
