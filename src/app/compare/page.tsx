"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitCompare, Plus, X, Star, MapPin, ShieldCheck, MessageCircle,
  CheckCircle2, XCircle, Package, Truck, Clock, AlertTriangle, Trophy
} from "lucide-react";
import { SUPPLIERS, getSupplierById, getProductById, PRODUCTS } from "@/data/mock-data";
import { Supplier } from "@/types";
import { formatRupiah, getStockBadgeClass, getStockLabel } from "@/lib/utils";

function ScoreBadge({ value, max, suffix = "" }: { value: number; max: number; suffix?: string }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "text-green-600 bg-green-50" : pct >= 40 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {value}{suffix}
    </span>
  );
}

function WinnerBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
      <Trophy className="w-3 h-3" /> {label}
    </span>
  );
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    const suppliers = ids.map((id) => getSupplierById(id)).filter(Boolean) as Supplier[];
    setSelectedSuppliers(suppliers);

    if (suppliers.length > 0) {
      const sharedProductIds = getSharedProducts(suppliers);
      if (sharedProductIds.length > 0) setSelectedProductId(sharedProductIds[0]);
    }
  }, [searchParams]);

  function getSharedProducts(suppliers: Supplier[]): string[] {
    if (suppliers.length === 0) return [];
    const sets = suppliers.map((s) => new Set(s.products.map((p) => p.productId)));
    const first = sets[0];
    return [...first].filter((id) => sets.slice(1).every((s) => s.has(id)));
  }

  function getAllProducts(suppliers: Supplier[]): string[] {
    const seen = new Set<string>();
    suppliers.forEach((s) => s.products.forEach((p) => seen.add(p.productId)));
    return [...seen];
  }

  const addSupplier = (id: string) => {
    const supplier = getSupplierById(id);
    if (!supplier || selectedSuppliers.some((s) => s.id === id)) return;
    const updated = [...selectedSuppliers, supplier];
    setSelectedSuppliers(updated);
    setShowPicker(false);
    router.replace(`/compare?ids=${updated.map((s) => s.id).join(",")}`);

    const shared = getSharedProducts(updated);
    if (!selectedProductId || !shared.includes(selectedProductId)) {
      setSelectedProductId(shared[0] || getAllProducts(updated)[0] || "");
    }
  };

  const removeSupplier = (id: string) => {
    const updated = selectedSuppliers.filter((s) => s.id !== id);
    setSelectedSuppliers(updated);
    router.replace(updated.length > 0 ? `/compare?ids=${updated.map((s) => s.id).join(",")}` : "/compare");
  };

  const sharedProducts = getSharedProducts(selectedSuppliers);
  const allProducts = getAllProducts(selectedSuppliers);
  const activeProductId = selectedProductId || sharedProducts[0] || allProducts[0] || "";

  // Winner calculations
  function getBestRating() {
    const max = Math.max(...selectedSuppliers.map((s) => s.rating));
    return selectedSuppliers.filter((s) => s.rating === max).map((s) => s.id);
  }
  function getBestPrice() {
    const prices = selectedSuppliers.map((s) => {
      const sp = s.products.find((p) => p.productId === activeProductId);
      return { id: s.id, price: sp ? sp.pricePerUnit * (1 - (sp.discount ?? 0) / 100) : Infinity };
    });
    const min = Math.min(...prices.map((p) => p.price));
    return prices.filter((p) => p.price === min).map((p) => p.id);
  }
  function getBestMoq() {
    const moqs = selectedSuppliers.map((s) => {
      const sp = s.products.find((p) => p.productId === activeProductId);
      return { id: s.id, moq: sp ? sp.minOrderQty : Infinity };
    });
    const min = Math.min(...moqs.map((p) => p.moq));
    return moqs.filter((p) => p.moq === min).map((p) => p.id);
  }

  const bestRating = selectedSuppliers.length > 0 ? getBestRating() : [];
  const bestPrice = selectedSuppliers.length > 0 && activeProductId ? getBestPrice() : [];
  const bestMoq = selectedSuppliers.length > 0 && activeProductId ? getBestMoq() : [];

  const availableToAdd = SUPPLIERS.filter((s) => !selectedSuppliers.some((sel) => sel.id === s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bandingkan Supplier</h1>
        </div>
        <p className="text-gray-500 text-sm">Analisis side-by-side untuk memilih supplier terbaik sesuai kebutuhan UMKM Anda</p>
      </div>

      {/* Empty state */}
      {selectedSuppliers.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Belum ada supplier yang dipilih</h3>
          <p className="text-gray-500 text-sm mb-6">Pilih minimal 2 supplier untuk mulai membandingkan harga, MOQ, dan spesifikasi lainnya</p>
          <Link href="/suppliers" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> Pilih Supplier dari Katalog
          </Link>
        </div>
      )}

      {/* Comparison table */}
      {selectedSuppliers.length > 0 && (
        <div className="space-y-6">
          {/* Supplier header row */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${selectedSuppliers.length}, 1fr)` }}>
              {/* Label column */}
              <div className="bg-gray-50 p-4 border-r border-gray-200 flex items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</span>
              </div>

              {/* Supplier columns */}
              {selectedSuppliers.map((s) => (
                <div key={s.id} className="p-4 border-r border-gray-200 last:border-r-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {s.logo}
                    </div>
                    <button onClick={() => removeSupplier(s.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</span>
                    {s.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" /> {s.city}
                  </div>
                  {bestRating.includes(s.id) && selectedSuppliers.length > 1 && (
                    <div className="mt-2"><WinnerBadge label="Rating Terbaik" /></div>
                  )}
                </div>
              ))}

              {/* Add column */}
              {selectedSuppliers.length < 3 && (
                <div className="p-4 flex flex-col items-center justify-center bg-gray-50">
                  <button
                    onClick={() => setShowPicker(true)}
                    className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors mb-1"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <span className="text-xs text-gray-400">Tambah</span>
                </div>
              )}
            </div>
          </div>

          {/* Supplier picker modal */}
          {showPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Tambah Supplier ke Perbandingan</h3>
                  <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableToAdd.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addSupplier(s.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {s.logo}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.city} · ★ {s.rating}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Product selector */}
          {allProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-gray-700">Bandingkan untuk produk:</span>
                <div className="flex flex-wrap gap-2">
                  {allProducts.map((pid) => {
                    const product = getProductById(pid);
                    const isShared = sharedProducts.includes(pid);
                    return (
                      <button
                        key={pid}
                        onClick={() => setSelectedProductId(pid)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          activeProductId === pid
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                        } ${!isShared ? "opacity-60" : ""}`}
                      >
                        {product?.name}
                        {!isShared && " (partial)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Comparison rows */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Section: Harga & Order */}
            <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
              <h3 className="font-semibold text-indigo-900 text-sm">Harga & Pemesanan</h3>
            </div>

            {/* Price row */}
            {activeProductId && (() => {
              const product = getProductById(activeProductId);
              return (
                <>
                  <CompareRow
                    label={`Harga / ${product?.unit ?? "unit"}`}
                    suppliers={selectedSuppliers}
                    winners={bestPrice}
                    render={(s) => {
                      const sp = s.products.find((p) => p.productId === activeProductId);
                      if (!sp) return <span className="text-gray-400 text-xs">Tidak tersedia</span>;
                      const final = sp.pricePerUnit * (1 - (sp.discount ?? 0) / 100);
                      return (
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{formatRupiah(final)}</div>
                          {sp.discount && (
                            <div className="text-xs text-gray-400 line-through">{formatRupiah(sp.pricePerUnit)}</div>
                          )}
                          {sp.discount && <span className="text-xs text-red-600 font-medium">Diskon {sp.discount}%</span>}
                        </div>
                      );
                    }}
                  />
                  <CompareRow
                    label="Min. Order Qty (MOQ)"
                    suppliers={selectedSuppliers}
                    winners={bestMoq}
                    render={(s) => {
                      const sp = s.products.find((p) => p.productId === activeProductId);
                      if (!sp) return <span className="text-gray-400 text-xs">—</span>;
                      return <span className="font-semibold text-gray-900 text-sm">{sp.minOrderQty} {product?.unit}</span>;
                    }}
                  />
                  <CompareRow
                    label="Status Stok"
                    suppliers={selectedSuppliers}
                    render={(s) => {
                      const sp = s.products.find((p) => p.productId === activeProductId);
                      if (!sp) return <span className="text-gray-400 text-xs">—</span>;
                      return (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStockBadgeClass(sp.stock)}`}>
                          {getStockLabel(sp.stock)}
                        </span>
                      );
                    }}
                  />
                </>
              );
            })()}

            <CompareRow
              label="Min. Nilai Order"
              suppliers={selectedSuppliers}
              winners={selectedSuppliers.length > 1 ? [selectedSuppliers.reduce((a, b) => a.minOrderValue < b.minOrderValue ? a : b).id] : []}
              render={(s) => <span className="font-semibold text-gray-900 text-sm">{formatRupiah(s.minOrderValue)}</span>}
            />

            {/* Section: Kualitas */}
            <div className="bg-yellow-50 px-5 py-3 border-b border-yellow-100 border-t border-t-gray-100">
              <h3 className="font-semibold text-yellow-900 text-sm">Kualitas & Kepercayaan</h3>
            </div>

            <CompareRow
              label="Rating"
              suppliers={selectedSuppliers}
              winners={bestRating}
              render={(s) => (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-900 text-sm">{s.rating}</span>
                  <span className="text-xs text-gray-500">/ 5</span>
                </div>
              )}
            />

            <CompareRow
              label="Jumlah Ulasan"
              suppliers={selectedSuppliers}
              winners={selectedSuppliers.length > 1 ? [selectedSuppliers.reduce((a, b) => a.reviewCount > b.reviewCount ? a : b).id] : []}
              render={(s) => <span className="font-semibold text-gray-900 text-sm">{s.reviewCount.toLocaleString("id-ID")} ulasan</span>}
            />

            <CompareRow
              label="Status Verifikasi"
              suppliers={selectedSuppliers}
              render={(s) => (
                s.verified
                  ? <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="w-4 h-4" /> Terverifikasi</span>
                  : <span className="flex items-center gap-1 text-xs text-gray-500"><XCircle className="w-4 h-4" /> Belum</span>
              )}
            />

            <CompareRow
              label="Tahun Bergabung"
              suppliers={selectedSuppliers}
              render={(s) => <span className="font-medium text-gray-900 text-sm">{s.joinedYear}</span>}
            />

            {/* Section: Operasional */}
            <div className="bg-green-50 px-5 py-3 border-b border-green-100 border-t border-t-gray-100">
              <h3 className="font-semibold text-green-900 text-sm">Operasional & Pengiriman</h3>
            </div>

            <CompareRow
              label="Waktu Respons"
              suppliers={selectedSuppliers}
              render={(s) => (
                <span className="flex items-center gap-1 text-sm text-gray-800 font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {s.responseTime}
                </span>
              )}
            />

            <CompareRow
              label="Opsi Pengiriman"
              suppliers={selectedSuppliers}
              render={(s) => (
                <div className="flex flex-col gap-1">
                  {s.shippingOptions.slice(0, 2).map((opt) => (
                    <span key={opt} className="text-xs text-gray-700 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-gray-400" /> {opt}
                    </span>
                  ))}
                  {s.shippingOptions.length > 2 && (
                    <span className="text-xs text-gray-400">+{s.shippingOptions.length - 2} lainnya</span>
                  )}
                </div>
              )}
            />

            <CompareRow
              label="Lokasi"
              suppliers={selectedSuppliers}
              render={(s) => (
                <span className="text-sm text-gray-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> {s.city}, {s.province}
                </span>
              )}
            />

            {/* Section: Aksi */}
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 border-t border-t-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">Aksi</h3>
            </div>

            <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `200px repeat(${selectedSuppliers.length}, 1fr)` }}>
              <div className="bg-gray-50 p-4 border-r border-gray-100" />
              {selectedSuppliers.map((s) => (
                <div key={s.id} className="p-4 border-r border-gray-100 last:border-r-0 space-y-2">
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="w-full text-center text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors block"
                  >
                    Lihat Detail
                  </Link>
                  <a
                    href={`https://wa.me/${s.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium border border-green-500 text-green-600 hover:bg-green-50 py-2 px-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedSuppliers.length >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Ringkasan Perbandingan</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {bestRating.length > 0 && (
                      <li>• <span className="font-medium">Rating terbaik:</span> {bestRating.map((id) => getSupplierById(id)?.name).join(", ")}</li>
                    )}
                    {bestPrice.length > 0 && activeProductId && (
                      <li>• <span className="font-medium">Harga terbaik untuk {getProductById(activeProductId)?.name}:</span> {bestPrice.map((id) => getSupplierById(id)?.name).join(", ")}</li>
                    )}
                    {bestMoq.length > 0 && activeProductId && (
                      <li>• <span className="font-medium">MOQ terkecil:</span> {bestMoq.map((id) => getSupplierById(id)?.name).join(", ")}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Link href="/suppliers" className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Package className="w-4 h-4" /> Tambah lebih banyak supplier
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  suppliers,
  render,
  winners = [],
}: {
  label: string;
  suppliers: Supplier[];
  render: (s: Supplier) => React.ReactNode;
  winners?: string[];
}) {
  return (
    <div className="grid border-b border-gray-100 last:border-b-0" style={{ gridTemplateColumns: `200px repeat(${suppliers.length}, 1fr)` }}>
      <div className="bg-gray-50 p-4 border-r border-gray-100 flex items-center">
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      {suppliers.map((s) => (
        <div key={s.id} className={`p-4 border-r border-gray-100 last:border-r-0 ${winners.includes(s.id) ? "bg-green-50" : ""}`}>
          <div>{render(s)}</div>
          {winners.includes(s.id) && suppliers.length > 1 && (
            <div className="mt-1">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Terbaik</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat halaman perbandingan...</div>}>
      <ComparisonContent />
    </Suspense>
  );
}
