"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, PROVINCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  onSearch: (query: string, category: string, province: string, maxPrice: number) => void;
  initialQuery?: string;
  initialCategory?: string;
}

const selectClass =
  "h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink transition-colors focus-visible:border-accent";

export default function SearchBar({ onSearch, initialQuery = "", initialCategory = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [province, setProvince] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, category, province, maxPrice);
  };

  const handleClear = () => {
    setQuery("");
    setCategory("");
    setProvince("");
    setMaxPrice(0);
    onSearch("", "", "", 0);
  };

  const hasActiveFilters = category || province || maxPrice > 0;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} role="search">
        {/* Main search input */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <label htmlFor="search-query" className="sr-only">Cari bahan baku atau supplier</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahan baku atau supplier (contoh: tepung terigu, kain cotton…)"
              className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-11 pr-11 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); onSearch("", category, province, maxPrice); }}
                aria-label="Hapus kata kunci"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="search-filters"
            className={cn(
              "relative flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors sm:flex-none",
              hasActiveFilters
                ? "border-accent bg-accent-soft text-accent"
                : "border-line-strong bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Filter</span>
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />}
          </button>

          <button
            type="submit"
            className="h-12 flex-1 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover sm:flex-none"
          >
            Cari
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div id="search-filters" className="mt-3 rounded-xl border border-line bg-surface p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="filter-category" className="mb-1.5 block text-xs font-semibold text-ink-muted">Kategori</label>
                <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-province" className="mb-1.5 block text-xs font-semibold text-ink-muted">Provinsi</label>
                <select id="filter-province" value={province} onChange={(e) => setProvince(e.target.value)} className={selectClass}>
                  <option value="">Semua Provinsi</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-price" className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Harga maks/unit{" "}
                  <span className="font-medium tabular-nums text-ink">
                    {maxPrice > 0 ? `Rp ${maxPrice.toLocaleString("id-ID")}` : "Bebas"}
                  </span>
                </label>
                <input
                  id="filter-price"
                  type="range"
                  min={0}
                  max={200000}
                  step={5000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="h-11 w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-ink-subtle">
                  <span>Bebas</span><span>Rp 200.000</span>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="mt-4 flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-danger transition-colors hover:bg-surface-muted"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Reset semua filter
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
