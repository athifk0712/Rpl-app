"use client";

import { useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GitCompare, Plus, X, Star, MapPin, BadgeCheck, MessageCircle, Truck, Check, Minus } from "lucide-react";
import type { Product, Supplier, SupplierProduct } from "@/types";
import { cn, formatRupiah, getStockLabel } from "@/lib/utils";

const MAX_COMPARE = 3;

const STOCK_CLASS: Record<SupplierProduct["stock"], string> = {
  tersedia: "bg-success-soft text-success",
  terbatas: "bg-warning-soft text-warning",
  habis: "bg-danger-soft text-danger",
};

function getAllProducts(suppliers: Supplier[]): string[] {
  const seen = new Set<string>();
  suppliers.forEach((s) => s.products.forEach((p) => seen.add(p.productId)));
  return [...seen];
}

function finalPrice(sp: SupplierProduct) {
  return sp.pricePerUnit * (1 - (sp.discount ?? 0) / 100);
}

// Ids with the best value. Empty when fewer than 2 suppliers have a value to compare or they all tie.
function pickWinners(entries: { id: string; value: number | null }[], mode: "min" | "max"): string[] {
  const valid = entries.filter((e): e is { id: string; value: number } => e.value !== null);
  if (valid.length < 2) return [];
  const best = mode === "min" ? Math.min(...valid.map((e) => e.value)) : Math.max(...valid.map((e) => e.value));
  const winners = valid.filter((e) => e.value === best).map((e) => e.id);
  return winners.length === valid.length ? [] : winners;
}

function Monogram({ supplier, size = "md" }: { supplier: Supplier; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted font-bold tracking-wide text-primary-soft",
        size === "md" ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs"
      )}
    >
      {supplier.logo}
    </span>
  );
}

function ComparisonContent({ suppliers }: { suppliers: Supplier[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pickerRef = useRef<HTMLDialogElement>(null);
  const [pickedProductId, setPickedProductId] = useState("");

  const getSupplierById = (id: string) => suppliers.find((s) => s.id === id);
  const productById = new Map<string, Product>(suppliers.flatMap((s) => s.products.map((sp) => [sp.productId, sp.product])));
  const getProductById = (id: string) => productById.get(id);

  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const selected = [...new Set(ids)]
    .map((id) => getSupplierById(id))
    .filter((s): s is Supplier => Boolean(s))
    .slice(0, MAX_COMPARE);

  const sellerCount = (pid: string) => selected.filter((s) => s.products.some((p) => p.productId === pid)).length;
  // Most comparable products first: those sold by the most selected suppliers
  const allProducts = getAllProducts(selected).sort((a, b) => sellerCount(b) - sellerCount(a));
  const activeProductId = allProducts.includes(pickedProductId) ? pickedProductId : allProducts[0] ?? "";
  const activeProduct = activeProductId ? getProductById(activeProductId) : undefined;
  const offerOf = (s: Supplier) => s.products.find((p) => p.productId === activeProductId);

  const canAdd = selected.length < MAX_COMPARE;
  const availableToAdd = suppliers.filter((s) => !selected.some((sel) => sel.id === s.id));

  const setIds = (next: string[]) => {
    router.replace(next.length > 0 ? `/compare?ids=${next.join(",")}` : "/compare", { scroll: false });
  };
  const addSupplier = (id: string) => {
    if (canAdd && !selected.some((s) => s.id === id)) setIds([...selected.map((s) => s.id), id]);
    pickerRef.current?.close();
  };
  const removeSupplier = (id: string) => setIds(selected.filter((s) => s.id !== id).map((s) => s.id));
  const openPicker = () => pickerRef.current?.showModal();

  const bestPrice = pickWinners(selected.map((s) => ({ id: s.id, value: offerOf(s) ? finalPrice(offerOf(s)!) : null })), "min");
  const bestMoq = pickWinners(selected.map((s) => ({ id: s.id, value: offerOf(s)?.minOrderQty ?? null })), "min");
  const bestMinOrder = pickWinners(selected.map((s) => ({ id: s.id, value: s.minOrderValue })), "min");
  const bestRating = pickWinners(selected.map((s) => ({ id: s.id, value: s.rating })), "max");
  const bestReviews = pickWinners(selected.map((s) => ({ id: s.id, value: s.reviewCount })), "max");

  const supplierOf = (id: string) => selected.find((s) => s.id === id)!;
  const verdicts = [
    {
      label: `Harga terendah${activeProduct ? ` · ${activeProduct.name}` : ""}`,
      winners: bestPrice,
      value: (s: Supplier) => `${formatRupiah(finalPrice(offerOf(s)!))}/${activeProduct?.unit}`,
    },
    {
      label: "Minimum order terkecil",
      winners: bestMoq,
      value: (s: Supplier) => `${offerOf(s)!.minOrderQty} ${activeProduct?.unit}`,
    },
    {
      label: "Rating tertinggi",
      winners: bestRating,
      value: (s: Supplier) => `${s.rating.toFixed(1)} dari 5`,
    },
  ];

  const showAddColumn = canAdd && selected.length > 0;
  const columnCount = selected.length + 1 + (showAddColumn ? 1 : 0);

  return (
    <>
      {/* Page header */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-accent">Perbandingan</p>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">Bandingkan supplier</h1>
            <p className="mt-2 text-base text-ink-muted">
              Harga, minimum order, stok, dan reputasi hingga {MAX_COMPARE} supplier dalam satu tabel.
            </p>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-4">
              <p className="text-sm text-ink-muted">
                <span className="font-semibold tabular-nums text-ink">{selected.length}</span> dari {MAX_COMPARE} supplier
              </p>
              {canAdd && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Tambah supplier
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {/* Empty state */}
        {selected.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
              <GitCompare className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">Belum ada supplier yang dipilih</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              Pilih minimal 2 supplier untuk melihat siapa yang menawarkan harga, minimum order, dan rating terbaik.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openPicker}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Pilih supplier
              </button>
              <Link
                href="/suppliers"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                Buka katalog supplier
              </Link>
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="space-y-8">
            {/* Product selector */}
            {allProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-ink">Produk yang dibandingkan</h2>
                <p className="mt-1 text-[13px] text-ink-subtle">
                  Harga, minimum order, dan stok di bawah mengikuti produk yang dipilih.
                </p>
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {allProducts.map((pid) => {
                    const product = getProductById(pid);
                    const sellers = sellerCount(pid);
                    const active = activeProductId === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setPickedProductId(pid)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[13px] font-medium transition-colors duration-150",
                          active
                            ? "border-primary bg-primary text-on-primary"
                            : "border-line-strong bg-surface text-ink hover:border-ink-subtle"
                        )}
                      >
                        {product?.name}
                        {sellers < selected.length && (
                          <span className={cn("text-xs font-normal tabular-nums", active ? "text-on-primary-muted" : "text-ink-subtle")}>
                            · {sellers}/{selected.length} supplier
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verdict */}
            {selected.length >= 2 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {verdicts.map(({ label, winners, value }) => (
                  <div key={label} className="rounded-xl border border-line bg-surface p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{label}</p>
                    {winners.length > 0 ? (
                      <>
                        <p className="mt-2 text-base font-bold leading-snug text-ink">
                          {winners.map((id) => supplierOf(id).name).join(" & ")}
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-success">{value(supplierOf(winners[0]))}</p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-ink-muted">Tidak ada yang lebih unggul untuk kriteria ini.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-ink">
                Tambahkan minimal 1 supplier lagi untuk melihat mana yang paling unggul.
              </p>
            )}

            {/* Comparison table */}
            <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[600px] table-fixed border-collapse text-left text-sm">
                <caption className="sr-only">Perbandingan detail supplier</caption>
                <thead>
                  <tr className="border-b border-line">
                    <td className="sticky left-0 z-10 w-28 bg-surface p-4 align-bottom shadow-[1px_0_0_var(--color-line)] sm:w-44">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Supplier</span>
                    </td>
                    {selected.map((s) => (
                      <th key={s.id} scope="col" className="border-l border-line p-4 align-top font-normal">
                        <div className="flex items-start justify-between gap-2">
                          <Monogram supplier={s} />
                          <button
                            type="button"
                            onClick={() => removeSupplier(s.id)}
                            aria-label={`Hapus ${s.name} dari perbandingan`}
                            className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <Link
                          href={`/suppliers/${s.id}`}
                          className="mt-3 block rounded-sm text-[15px] font-semibold leading-snug text-ink hover:text-accent"
                        >
                          {s.name}
                        </Link>
                        <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-subtle">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {s.city}
                        </p>
                      </th>
                    ))}
                    {showAddColumn && (
                      <td className="w-40 border-l border-line p-4 align-middle">
                        <button
                          type="button"
                          onClick={openPicker}
                          className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-[13px] font-medium text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                        >
                          <Plus className="h-5 w-5" aria-hidden="true" />
                          Tambah supplier
                        </button>
                      </td>
                    )}
                  </tr>
                </thead>

                <SectionRows title="Harga & pemesanan" columnCount={columnCount}>
                  {activeProduct && (
                    <>
                      <CompareRow label={`Harga per ${activeProduct.unit}`} suppliers={selected} winners={bestPrice} addColumn={showAddColumn}>
                        {(s) => {
                          const sp = offerOf(s);
                          if (!sp) return <NotAvailable />;
                          return (
                            <div>
                              <span className="text-base font-bold tabular-nums text-ink">{formatRupiah(finalPrice(sp))}</span>
                              {sp.discount ? (
                                <p className="mt-0.5 text-xs tabular-nums text-ink-subtle">
                                  <span className="line-through">{formatRupiah(sp.pricePerUnit)}</span>
                                  <span className="ml-1.5 font-semibold text-danger">−{sp.discount}%</span>
                                </p>
                              ) : null}
                            </div>
                          );
                        }}
                      </CompareRow>
                      <CompareRow label="Minimum order (MOQ)" suppliers={selected} winners={bestMoq} addColumn={showAddColumn}>
                        {(s) => {
                          const sp = offerOf(s);
                          return sp ? (
                            <span className="font-semibold tabular-nums text-ink">{sp.minOrderQty} {activeProduct.unit}</span>
                          ) : (
                            <NotAvailable />
                          );
                        }}
                      </CompareRow>
                      <CompareRow label="Stok" suppliers={selected} addColumn={showAddColumn}>
                        {(s) => {
                          const sp = offerOf(s);
                          return sp ? (
                            <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", STOCK_CLASS[sp.stock])}>
                              {getStockLabel(sp.stock)}
                            </span>
                          ) : (
                            <NotAvailable />
                          );
                        }}
                      </CompareRow>
                    </>
                  )}
                  <CompareRow label="Min. nilai order" suppliers={selected} winners={bestMinOrder} addColumn={showAddColumn}>
                    {(s) => <span className="font-semibold tabular-nums text-ink">{formatRupiah(s.minOrderValue)}</span>}
                  </CompareRow>
                </SectionRows>

                <SectionRows title="Reputasi" columnCount={columnCount}>
                  <CompareRow label="Rating" suppliers={selected} winners={bestRating} addColumn={showAddColumn}>
                    {(s) => (
                      <span className="flex items-center gap-1 font-semibold tabular-nums text-ink">
                        <Star className="h-4 w-4 fill-rating text-rating" aria-hidden="true" />
                        {s.rating.toFixed(1)}
                        <span className="font-normal text-ink-subtle">/ 5</span>
                      </span>
                    )}
                  </CompareRow>
                  <CompareRow label="Jumlah ulasan" suppliers={selected} winners={bestReviews} addColumn={showAddColumn}>
                    {(s) => <span className="font-semibold tabular-nums text-ink">{s.reviewCount.toLocaleString("id-ID")}</span>}
                  </CompareRow>
                  <CompareRow label="Verifikasi" suppliers={selected} addColumn={showAddColumn}>
                    {(s) =>
                      s.verified ? (
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-success">
                          <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Terverifikasi
                        </span>
                      ) : (
                        <span className="text-[13px] text-ink-subtle">Belum terverifikasi</span>
                      )
                    }
                  </CompareRow>
                  <CompareRow label="Bergabung sejak" suppliers={selected} addColumn={showAddColumn}>
                    {(s) => <span className="tabular-nums text-ink">{s.joinedYear}</span>}
                  </CompareRow>
                </SectionRows>

                <SectionRows title="Operasional" columnCount={columnCount}>
                  <CompareRow label="Waktu respons" suppliers={selected} addColumn={showAddColumn}>
                    {(s) => <span className="font-medium text-ink">{s.responseTime}</span>}
                  </CompareRow>
                  <CompareRow label="Pengiriman" suppliers={selected} addColumn={showAddColumn}>
                    {(s) => (
                      <ul className="space-y-1">
                        {s.shippingOptions.map((opt) => (
                          <li key={opt} className="flex items-start gap-1.5 text-[13px] text-ink">
                            <Truck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-subtle" aria-hidden="true" />
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CompareRow>
                  <CompareRow label="Lokasi" suppliers={selected} addColumn={showAddColumn}>
                    {(s) => <span className="text-ink">{s.city}, {s.province}</span>}
                  </CompareRow>
                </SectionRows>

                <tfoot>
                  <tr className="border-t border-line">
                    <td className="sticky left-0 z-10 bg-surface p-4 shadow-[1px_0_0_var(--color-line)]" />
                    {selected.map((s) => (
                      <td key={s.id} className="border-l border-line p-4">
                        <div className="flex flex-col gap-2">
                          <a
                            href={`https://wa.me/${s.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            Hubungi<span className="sr-only"> {s.name} via WhatsApp</span>
                          </a>
                          <Link
                            href={`/suppliers/${s.id}`}
                            className="flex h-10 items-center justify-center rounded-lg border border-line-strong px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-muted"
                          >
                            Lihat detail<span className="sr-only"> {s.name}</span>
                          </Link>
                        </div>
                      </td>
                    ))}
                    {showAddColumn && <td className="border-l border-line" />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Supplier picker */}
      <dialog
        ref={pickerRef}
        aria-labelledby="picker-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-[0_24px_64px_-16px_rgb(15_23_42/0.45)] backdrop:bg-primary/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="picker-title" className="text-base font-bold tracking-tight text-ink">Tambah supplier</h2>
          <button
            type="button"
            onClick={() => pickerRef.current?.close()}
            aria-label="Tutup"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {availableToAdd.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => addSupplier(s.id)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-canvas"
              >
                <Monogram supplier={s} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <span className="truncate">{s.name}</span>
                    {s.verified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-success" aria-label="Terverifikasi" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-subtle">
                    {s.city} · {s.categories.join(", ")}
                  </span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-ink">
                  <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden="true" />
                  {s.rating.toFixed(1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}

function NotAvailable() {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-ink-subtle">
      <Minus className="h-3.5 w-3.5" aria-hidden="true" /> Tidak dijual
    </span>
  );
}

function SectionRows({ title, columnCount, children }: { title: string; columnCount: number; children: React.ReactNode }) {
  return (
    <tbody>
      <tr className="border-t border-line bg-canvas">
        <th scope="colgroup" colSpan={columnCount} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          <span className="sticky left-4 inline-block">{title}</span>
        </th>
      </tr>
      {children}
    </tbody>
  );
}

function CompareRow({
  label,
  suppliers,
  winners = [],
  addColumn,
  children,
}: {
  label: string;
  suppliers: Supplier[];
  winners?: string[];
  addColumn: boolean;
  children: (s: Supplier) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-line">
      <th scope="row" className="sticky left-0 z-10 bg-surface p-4 align-top text-[13px] font-medium text-ink-muted shadow-[1px_0_0_var(--color-line)]">
        {label}
      </th>
      {suppliers.map((s) => {
        const isWinner = winners.includes(s.id);
        return (
          <td key={s.id} className={cn("border-l border-line p-4 align-top", isWinner && "bg-success-soft")}>
            {children(s)}
            {isWinner && (
              <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Terbaik
              </span>
            )}
          </td>
        );
      })}
      {addColumn && <td className="border-l border-line" />}
    </tr>
  );
}

function CompareFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <p className="sr-only">Memuat halaman perbandingan…</p>
      <div className="h-8 w-64 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-muted" />
    </div>
  );
}

export default function CompareClient({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <Suspense fallback={<CompareFallback />}>
      <ComparisonContent suppliers={suppliers} />
    </Suspense>
  );
}
