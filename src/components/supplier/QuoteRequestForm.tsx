"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { submitQuoteRequest } from "@/lib/api";
import { finalPrice } from "@/lib/pricing";
import { formatRupiah } from "@/lib/utils";
import type { QuoteField, QuoteFieldErrors, QuoteRequest, SupplierProduct } from "@/types";

interface Props {
  supplierId: string;
  offers: SupplierProduct[];
}

const EMPTY_FORM = { productId: "", businessName: "", contactName: "", phone: "", quantity: "", note: "" };

type FormField = keyof typeof EMPTY_FORM;

const inputClass =
  "w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

// Validasi utama ada di server; form hanya menampilkan pesan error per field dari respons API.
export default function QuoteRequestForm({ supplierId, offers }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<QuoteFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<QuoteRequest | null>(null);

  const offer = offers.find((o) => o.productId === form.productId);
  const quantity = Number(form.quantity);
  const estimate = offer && quantity > 0 ? finalPrice(offer) * quantity : 0;

  const update = (name: FormField, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const result = await submitQuoteRequest({ ...form, supplierId, quantity });
    setSubmitting(false);
    if (result.ok) {
      setCreated(result.quote);
      setForm(EMPTY_FORM);
      setErrors({});
    } else {
      setErrors(result.fields);
      setFormError(result.error);
    }
  };

  if (created) {
    return (
      <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2 font-semibold text-green-800">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Permintaan penawaran terkirim
        </div>
        <dl className="mt-3 space-y-1 text-sm text-green-900">
          <div className="flex justify-between gap-4">
            <dt>Nomor referensi</dt>
            <dd className="font-mono font-semibold">{created.code}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Produk</dt>
            <dd className="text-right">{created.productName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Jumlah</dt>
            <dd>{created.quantity} {created.unit}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Estimasi total</dt>
            <dd className="font-semibold">{formatRupiah(created.estimatedTotal)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/permintaan" className="font-semibold text-blue-700 hover:underline">
            Lihat semua permintaan
          </Link>
          <button type="button" onClick={() => setCreated(null)} className="font-medium text-gray-700 hover:underline">
            Buat permintaan lain
          </button>
        </div>
      </div>
    );
  }

  const control = (name: QuoteField) => ({
    id: `quote-${name}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `quote-${name}-error` : undefined,
    className: `${inputClass} ${errors[name] ? "border-red-400" : "border-gray-300"}`,
  });

  const field = (name: QuoteField, label: string, input: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`quote-${name}`} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {input}
      {errors[name] ? (
        <p id={`quote-${name}-error`} className="mt-1 text-xs text-red-600">{errors[name]}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {field(
        "productId",
        "Produk",
        <select {...control("productId")} value={form.productId} onChange={(e) => update("productId", e.target.value)}>
          <option value="">Pilih produk…</option>
          {offers.map((o) => (
            <option key={o.productId} value={o.productId} disabled={o.stock === "habis"}>
              {o.product.name} — {formatRupiah(finalPrice(o))}/{o.product.unit}
              {o.stock === "habis" ? " (stok habis)" : ""}
            </option>
          ))}
        </select>
      )}
      {field(
        "quantity",
        "Jumlah",
        <input
          {...control("quantity")}
          type="number"
          inputMode="numeric"
          min={offer?.minOrderQty ?? 1}
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
        />,
        offer ? `Minimum order ${offer.minOrderQty} ${offer.product.unit}` : undefined
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "businessName",
          "Nama usaha",
          <input {...control("businessName")} value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        )}
        {field(
          "contactName",
          "Nama kontak",
          <input {...control("contactName")} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
        )}
      </div>
      {field(
        "phone",
        "Nomor WhatsApp",
        <input
          {...control("phone")}
          type="tel"
          inputMode="tel"
          placeholder="081234567890"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      )}
      {field(
        "note",
        "Catatan (opsional)",
        <textarea {...control("note")} rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} />,
        "Misalnya jadwal pengiriman atau spesifikasi khusus."
      )}

      {estimate > 0 && (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Estimasi total: <span className="font-semibold text-gray-900">{formatRupiah(estimate)}</span>
          <span className="text-gray-500"> (belum termasuk ongkos kirim)</span>
        </p>
      )}
      {formError && <p role="alert" className="text-sm font-medium text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden="true" /> {submitting ? "Mengirim…" : "Kirim Permintaan Penawaran"}
      </button>
    </form>
  );
}
