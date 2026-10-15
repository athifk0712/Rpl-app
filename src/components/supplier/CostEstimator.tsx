"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { estimateCost, zoneLabel } from "@/lib/cost-estimate";
import { finalPrice } from "@/lib/pricing";
import { formatRupiah } from "@/lib/utils";
import type { Supplier } from "@/types";

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function CostEstimator({ supplier }: { supplier: Supplier }) {
  const offers = supplier.products.filter((o) => o.stock !== "habis");
  const zones = Object.keys(supplier.shippingCost);
  const [productId, setProductId] = useState(offers[0]?.productId ?? "");
  const [quantity, setQuantity] = useState(String(offers[0]?.minOrderQty ?? ""));
  const [zone, setZone] = useState(zones[0] ?? "");

  if (offers.length === 0) {
    return <p className="text-sm text-gray-600">Semua produk supplier ini sedang habis, estimasi belum bisa dihitung.</p>;
  }

  const offer = offers.find((o) => o.productId === productId) ?? offers[0];
  const result = estimateCost({ supplier, offer, quantity: Number(quantity), zone: zone || undefined });
  const unit = offer.product.unit;

  const selectProduct = (id: string) => {
    setProductId(id);
    const next = offers.find((o) => o.productId === id);
    if (next) setQuantity(String(next.minOrderQty));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label htmlFor="estimate-product" className="mb-1 block text-sm font-medium text-gray-700">Produk</label>
          <select id="estimate-product" className={inputClass} value={offer.productId} onChange={(e) => selectProduct(e.target.value)}>
            {offers.map((o) => (
              <option key={o.productId} value={o.productId}>
                {o.product.name} — {formatRupiah(finalPrice(o))}/{o.product.unit}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="estimate-quantity" className="mb-1 block text-sm font-medium text-gray-700">Jumlah ({unit})</label>
          <input
            id="estimate-quantity"
            type="number"
            inputMode="numeric"
            min={1}
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="estimate-zone" className="mb-1 block text-sm font-medium text-gray-700">Zona pengiriman</label>
          <select id="estimate-zone" className={inputClass} value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">Ambil sendiri (tanpa ongkir)</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {zoneLabel(z)} — {formatRupiah(supplier.shippingCost[z])}
              </option>
            ))}
          </select>
        </div>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Harga per {unit} (setelah diskon)</dt>
          <dd className="tabular-nums text-gray-900">{formatRupiah(result.unitPrice)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Subtotal</dt>
          <dd className="tabular-nums text-gray-900">{formatRupiah(result.subtotal)}</dd>
        </div>
        {result.savings > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Hemat dari diskon</dt>
            <dd className="tabular-nums text-green-700">−{formatRupiah(result.savings)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Ongkos kirim</dt>
          <dd className="tabular-nums text-gray-900">{zone ? formatRupiah(result.shippingCost ?? 0) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-200 pt-2 font-semibold">
          <dt className="text-gray-900">Total estimasi</dt>
          <dd className="tabular-nums text-gray-900" data-testid="estimate-total">{formatRupiah(result.total)}</dd>
        </div>
      </dl>

      {result.issues.length > 0 ? (
        <ul role="alert" className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {result.issues.map((issue) => (
            <li key={issue} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /> {issue}
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Pesanan memenuhi syarat minimum supplier.
        </p>
      )}
    </div>
  );
}
