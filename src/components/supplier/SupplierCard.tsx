"use client";

import Link from "next/link";
import { MapPin, Star, ShieldCheck, MessageCircle, GitCompare, Clock } from "lucide-react";
import { Supplier } from "@/types";
import { formatRupiah } from "@/lib/utils";

interface Props {
  supplier: Supplier;
  onAddCompare?: (id: string) => void;
  compareList?: string[];
}

export default function SupplierCard({ supplier, onAddCompare, compareList = [] }: Props) {
  const isInCompare = compareList.includes(supplier.id);
  const compareDisabled = compareList.length >= 3 && !isInCompare;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {supplier.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{supplier.name}</h3>
              {supplier.verified && (
                <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 truncate">{supplier.city}, {supplier.province}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-gray-800">{supplier.rating}</span>
            <span className="text-xs text-gray-500">({supplier.reviewCount} ulasan)</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{supplier.responseTime}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
          {supplier.description}
        </p>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-3">
          {supplier.categories.map((cat) => (
            <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {cat}
            </span>
          ))}
        </div>

        {/* Min order */}
        <div className="bg-gray-50 rounded-lg p-2.5 mb-4">
          <span className="text-xs text-gray-500">Min. Order: </span>
          <span className="text-xs font-semibold text-gray-800">{formatRupiah(supplier.minOrderValue)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/suppliers/${supplier.id}`}
            className="flex-1 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors"
          >
            Lihat Detail
          </Link>
          <a
            href={`https://wa.me/${supplier.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 border border-green-500 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Hubungi via WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          {onAddCompare && (
            <button
              onClick={() => onAddCompare(supplier.id)}
              disabled={compareDisabled}
              title={isInCompare ? "Hapus dari perbandingan" : "Tambah ke perbandingan"}
              className={`p-2 rounded-lg border transition-colors ${
                isInCompare
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : compareDisabled
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
