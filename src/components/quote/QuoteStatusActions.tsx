"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeQuoteStatus } from "@/lib/api";
import { TRANSITIONS } from "@/lib/quote-status";
import type { QuoteRequest, QuoteStatus } from "@/types";
import { MAX_UNIT_PRICE } from "@/lib/limits";

const buttonClass = "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

const ACTIONS: { status: QuoteStatus; label: string; className: string }[] = [
  { status: "DITERIMA", label: "Terima", className: "bg-green-600 text-white hover:bg-green-700" },
  { status: "DITOLAK", label: "Tolak", className: "border border-red-300 text-red-700 hover:bg-red-50" },
  { status: "DIBATALKAN", label: "Batalkan", className: "border border-gray-300 text-gray-700 hover:bg-gray-50" },
];

// Tombol aksi sesuai status saat ini. Validasi tetap di server (PATCH /api/quote-requests/:id).
export default function QuoteStatusActions({ quote }: { quote: QuoteRequest }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState(String(quote.unitPrice));
  const [replyNote, setReplyNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const allowed = TRANSITIONS[quote.status];
  if (allowed.length === 0) return null;

  const submit = async (status: QuoteStatus) => {
    setPending(true);
    setError("");
    const result = await changeQuoteStatus(
      quote.id,
      status === "DIBALAS" ? { status, offeredPrice: Number(offeredPrice), replyNote } : { status }
    );
    setPending(false);
    if (!result.ok) return setError(result.error);
    setReplying(false);
    router.refresh();
  };

  if (replying) {
    return (
      <form
        className="mt-2 w-56 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit("DIBALAS");
        }}
      >
        <label className="block text-xs font-medium text-ink" htmlFor={`offer-${quote.id}`}>
          Harga penawaran per {quote.unit}
        </label>
        <input
          id={`offer-${quote.id}`}
          type="number"
          min={1}
          max={MAX_UNIT_PRICE}
          value={offeredPrice}
          onChange={(e) => setOfferedPrice(e.target.value)}
          className="w-full rounded-lg border border-line-strong px-2 py-1.5 text-sm"
        />
        <textarea
          aria-label="Pesan balasan"
          placeholder="Pesan (opsional)"
          rows={2}
          value={replyNote}
          onChange={(e) => setReplyNote(e.target.value)}
          className="w-full rounded-lg border border-line-strong px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={`${buttonClass} bg-primary text-on-primary hover:bg-primary-hover`}>
            {pending ? "Menyimpan…" : "Kirim balasan"}
          </button>
          <button type="button" onClick={() => setReplying(false)} className={`${buttonClass} text-ink-muted hover:bg-surface-muted`}>
            Batal
          </button>
        </div>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {allowed.includes("DIBALAS") && (
          <button type="button" onClick={() => setReplying(true)} className={`${buttonClass} bg-primary text-on-primary hover:bg-primary-hover`}>
            Balas (supplier)
          </button>
        )}
        {ACTIONS.filter((a) => allowed.includes(a.status)).map((a) => (
          <button key={a.status} type="button" disabled={pending} onClick={() => submit(a.status)} className={`${buttonClass} ${a.className}`}>
            {a.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
