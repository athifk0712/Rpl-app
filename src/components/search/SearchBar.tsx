"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, PROVINCES } from "@/data/mock-data";

interface Props {
  onSearch: (query: string, category: string, province: string, maxPrice: number) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
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
      <form onSubmit={handleSubmit}>
        {/* Main search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahan baku atau supplier (contoh: tepung terigu, kain cotton...)"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); onSearch("", category, province, maxPrice); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Cari
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Provinsi</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua Provinsi</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga Maks/Unit {maxPrice > 0 ? `(Rp ${maxPrice.toLocaleString("id-ID")})` : ""}
                </label>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={5000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Bebas</span><span>Rp 200.000</span>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button type="button" onClick={handleClear} className="mt-3 text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Reset semua filter
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
