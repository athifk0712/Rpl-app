"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LayoutGrid, List, SlidersHorizontal, ChevronDown } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import SupplierCard from "@/components/supplier/SupplierCard";
import ComparisonBar from "@/components/supplier/ComparisonBar";
import { SUPPLIERS, searchSuppliers } from "@/data/mock-data";
import { Supplier, SortOption } from "@/types";

function SuppliersContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<Supplier[]>(SUPPLIERS);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    if (query || category) {
      const filtered = searchSuppliers(query, category, "", 0);
      setResults(filtered);
    }
  }, [searchParams]);

  const handleSearch = (query: string, category: string, province: string, maxPrice: number) => {
    const filtered = searchSuppliers(query, category, province, maxPrice);
    setResults(filtered);
  };

  const handleAddCompare = (id: string) => {
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price_asc") return a.minOrderValue - b.minOrderValue;
    if (sortBy === "price_desc") return b.minOrderValue - a.minOrderValue;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "review") return b.reviewCount - a.reviewCount;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Cari Supplier Bahan Baku</h1>
        <p className="text-gray-500 text-sm">Temukan dan bandingkan supplier terpercaya untuk kebutuhan UMKM Anda</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          initialQuery={searchParams.get("query") || ""}
        />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600 font-medium">
          {sorted.length} supplier ditemukan
        </span>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-300 rounded-lg pl-3 pr-8 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="rating">Rating Tertinggi</option>
              <option value="review">Ulasan Terbanyak</option>
              <option value="price_asc">Min. Order Terendah</option>
              <option value="price_desc">Min. Order Tertinggi</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 transition-colors ${view === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compare hint */}
      {compareList.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-indigo-700">
          <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
          Klik ikon bandingkan (<span className="font-semibold">⇄</span>) pada kartu supplier untuk membandingkan hingga 3 supplier sekaligus.
        </div>
      )}

      {/* Results grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="font-semibold text-gray-700 mb-2">Supplier tidak ditemukan</h3>
          <p className="text-gray-500 text-sm">Coba ubah kata kunci atau reset filter pencarian</p>
        </div>
      ) : (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
          {sorted.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onAddCompare={handleAddCompare}
              compareList={compareList}
            />
          ))}
        </div>
      )}

      {/* Comparison bar */}
      <ComparisonBar
        compareList={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((x) => x !== id))}
        onClear={() => setCompareList([])}
      />
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat...</div>}>
      <SuppliersContent />
    </Suspense>
  );
}
