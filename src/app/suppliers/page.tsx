"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, ChevronDown, GitCompare, SearchX } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import SupplierCard from "@/components/supplier/SupplierCard";
import ComparisonBar from "@/components/supplier/ComparisonBar";
import { SUPPLIERS, searchSuppliers } from "@/data/mock-data";
import { SortOption } from "@/types";
import { cn } from "@/lib/utils";

interface Filters {
  query: string;
  category: string;
  province: string;
  maxPrice: number;
}

const EMPTY_FILTERS: Filters = { query: "", category: "", province: "", maxPrice: 0 };

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Rating tertinggi" },
  { value: "review", label: "Ulasan terbanyak" },
  { value: "price_asc", label: "Min. order terendah" },
  { value: "price_desc", label: "Min. order tertinggi" },
];

const CITY_COUNT = new Set(SUPPLIERS.map((s) => s.city)).size;

function SuppliersContent({
  initialFilters,
  compareList,
  onToggleCompare,
}: {
  initialFilters: Filters;
  compareList: string[];
  onToggleCompare: (id: string) => void;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [resetKey, setResetKey] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [view, setView] = useState<"grid" | "list">("grid");

  const results = searchSuppliers(filters.query, filters.category, filters.province, filters.maxPrice);
  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price_asc") return a.minOrderValue - b.minOrderValue;
    if (sortBy === "price_desc") return b.minOrderValue - a.minOrderValue;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "review") return b.reviewCount - a.reviewCount;
    return 0;
  });

  const resetSearch = () => {
    setFilters(EMPTY_FILTERS);
    setResetKey((k) => k + 1);
  };

  return (
    <>
      {/* Page header */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="text-sm font-semibold text-accent">Direktori supplier</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Cari supplier bahan baku
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            {SUPPLIERS.length} supplier dari {CITY_COUNT} kota. Cari berdasarkan nama bahan, supplier, atau kategori.
          </p>
          <div className="mt-6 max-w-4xl">
            <SearchBar
              key={resetKey}
              onSearch={(query, category, province, maxPrice) => setFilters({ query, category, province, maxPrice })}
              initialQuery={filters.query}
              initialCategory={filters.category}
            />
          </div>
        </div>
      </section>

      <div className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", compareList.length > 0 ? "pb-32" : "pb-16")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted" aria-live="polite">
            <span className="font-semibold tabular-nums text-ink">{sorted.length}</span> supplier
            {filters.query && <> untuk <span className="font-semibold text-ink">“{filters.query}”</span></>}
            {filters.category && <> di <span className="font-semibold text-ink">{filters.category}</span></>}
            {filters.province && <> · {filters.province}</>}
          </p>

          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="sr-only">Urutkan</label>
            <div className="relative">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 appearance-none rounded-lg border border-line-strong bg-surface pl-3 pr-9 text-sm font-medium text-ink transition-colors hover:border-ink-subtle"
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            </div>

            <div role="group" aria-label="Tampilan hasil" className="hidden rounded-lg border border-line-strong bg-surface p-0.5 md:flex">
              {([
                { value: "grid", label: "Tampilan kisi", Icon: LayoutGrid },
                { value: "list", label: "Tampilan daftar", Icon: List },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150",
                    view === value ? "bg-primary text-on-primary" : "text-ink-subtle hover:bg-surface-muted hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {compareList.length === 0 && sorted.length > 1 && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-subtle">
            Tekan
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-accent">
              <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">ikon bandingkan</span>
            </span>
            pada kartu untuk membandingkan hingga 3 supplier.
          </p>
        )}

        {/* Results */}
        {sorted.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
              <SearchX className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">Supplier tidak ditemukan</h2>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Coba kata kunci yang lebih umum, misalnya “tepung” atau “kain”, atau hapus filter yang aktif.
            </p>
            <button
              type="button"
              onClick={resetSearch}
              className="mt-6 h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className={cn("mt-6", view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4")}>
            {sorted.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onAddCompare={onToggleCompare}
                compareList={compareList}
                layout={view}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SuppliersRoute() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const [compareList, setCompareList] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <>
      {/* Remount when the URL filters change so the form and results start from the new URL */}
      <SuppliersContent
        key={`${query}|${category}`}
        initialFilters={{ ...EMPTY_FILTERS, query, category }}
        compareList={compareList}
        onToggleCompare={toggleCompare}
      />
      <ComparisonBar
        compareList={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((x) => x !== id))}
        onClear={() => setCompareList([])}
      />
    </>
  );
}

function SuppliersFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <p className="sr-only">Memuat daftar supplier…</p>
      <div className="h-8 w-72 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-6 h-12 max-w-4xl animate-pulse rounded-xl bg-surface-muted" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<SuppliersFallback />}>
      <SuppliersRoute />
    </Suspense>
  );
}
