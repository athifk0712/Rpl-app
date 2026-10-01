"use client";

import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function ComparisonBar({ suppliers, onRemove, onClear }: Props) {
  if (suppliers.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Daftar perbandingan supplier"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-12px_32px_-16px_rgb(15_23_42/0.25)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 sm:flex-nowrap">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <GitCompare className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>
            Bandingkan <span className="tabular-nums text-ink-subtle">({suppliers.length}/3)</span>
          </span>
        </p>

        <ul className="flex flex-1 flex-wrap items-center gap-2">
          {suppliers.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-1.5 pr-1 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-on-primary" aria-hidden="true">
                {s.logo}
              </span>
              <span className="max-w-[140px] truncate font-medium text-ink">{s.name}</span>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`Hapus ${s.name} dari perbandingan`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-muted hover:text-danger"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}

          {Array.from({ length: 3 - suppliers.length }).map((_, i) => (
            <li
              key={i}
              className="hidden items-center rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-xs text-ink-subtle sm:flex"
            >
              Slot kosong
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-danger"
          >
            Hapus semua
          </button>
          {suppliers.length >= 2 ? (
            <Link
              href={`/compare?ids=${suppliers.map((s) => s.id).join(",")}`}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Bandingkan sekarang
            </Link>
          ) : (
            <span className="text-xs text-ink-subtle">Pilih minimal 2 supplier</span>
          )}
        </div>
      </div>
    </div>
  );
}
