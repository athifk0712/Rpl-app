"use client";

import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { Supplier } from "@/types";
import { getSupplierById } from "@/data/mock-data";

interface Props {
  compareList: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function ComparisonBar({ compareList, onRemove, onClear }: Props) {
  if (compareList.length === 0) return null;

  const suppliers = compareList.map((id) => getSupplierById(id)).filter(Boolean) as Supplier[];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-indigo-200 shadow-2xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
          <GitCompare className="w-4 h-4" />
          <span>Bandingkan ({compareList.length}/3):</span>
        </div>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm">
              <div className="w-6 h-6 bg-indigo-600 rounded text-white text-xs font-bold flex items-center justify-center">
                {s.logo}
              </div>
              <span className="font-medium text-gray-800 max-w-[120px] truncate">{s.name}</span>
              <button onClick={() => onRemove(s.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 border-2 border-dashed border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400">
              + Tambah supplier
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onClear} className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded">
            Hapus semua
          </button>
          {compareList.length >= 2 && (
            <Link
              href={`/compare?ids=${compareList.join(",")}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Bandingkan Sekarang
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
