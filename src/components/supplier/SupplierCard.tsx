"use client";

import Link from "next/link";
import { MapPin, Star, BadgeCheck, MessageCircle, GitCompare, Check } from "lucide-react";
import { Supplier } from "@/types";
import { cn, formatRupiah } from "@/lib/utils";

interface Props {
  supplier: Supplier;
  onAddCompare?: (id: string) => void;
  compareList?: string[];
  layout?: "grid" | "list";
}

export default function SupplierCard({ supplier, onAddCompare, compareList = [], layout = "grid" }: Props) {
  const isList = layout === "list";
  const isInCompare = compareList.includes(supplier.id);
  const compareDisabled = compareList.length >= 3 && !isInCompare;

  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col rounded-xl border bg-surface transition-[border-color,box-shadow] duration-200",
        isList && "md:flex-row",
        isInCompare
          ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-line hover:border-line-strong hover:shadow-[0_12px_32px_-16px_rgb(15_23_42/0.25)]"
      )}
    >
      <div className="flex-1 p-5">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-sm font-bold tracking-wide text-primary-soft"
            aria-hidden="true"
          >
            {supplier.logo}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug text-ink">
              <Link href={`/suppliers/${supplier.id}`} className="rounded-sm hover:text-accent">
                {supplier.name}
              </Link>
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-subtle">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{supplier.city}, {supplier.province}</span>
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-muted">{supplier.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {supplier.verified && (
            <span className="inline-flex items-center gap-1 rounded-md border border-success-soft bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Terverifikasi
            </span>
          )}
          <ul className="flex flex-wrap gap-1.5" aria-label="Kategori">
            {supplier.categories.map((cat) => (
              <li key={cat} className="rounded-md border border-line px-2 py-0.5 text-xs font-medium text-ink-muted">
                {cat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cn("flex flex-col", isList && "md:w-[360px] md:flex-shrink-0 md:border-l md:border-line")}>
        {/* Key metrics */}
        <dl className={cn("grid grid-cols-3 divide-x divide-line border-y border-line", isList && "md:border-t-0")}>
          <div className="min-w-0 px-3 py-3 sm:px-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Rating</dt>
            <dd className="mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
              <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden="true" />
              {supplier.rating.toFixed(1)}
              <span className="font-normal text-ink-subtle">({supplier.reviewCount})</span>
            </dd>
          </div>
          <div className="min-w-0 px-3 py-3 sm:px-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Respons</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{supplier.responseTime}</dd>
          </div>
          <div className="min-w-0 px-3 py-3 sm:px-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Min. order</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">{formatRupiah(supplier.minOrderValue)}</dd>
          </div>
        </dl>

        {/* Actions */}
        <div className={cn("flex gap-2 p-4", isList && "md:mt-auto")}>
          <Link
            href={`/suppliers/${supplier.id}`}
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
          >
            Lihat Detail
          </Link>
          <a
            href={`https://wa.me/${supplier.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Hubungi ${supplier.name} via WhatsApp`}
            title="Hubungi via WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-success transition-colors duration-150 hover:border-success hover:bg-success-soft"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </a>
          {onAddCompare && (
            <button
              type="button"
              onClick={() => onAddCompare(supplier.id)}
              disabled={compareDisabled}
              aria-pressed={isInCompare}
              aria-label={
                isInCompare
                  ? `Hapus ${supplier.name} dari perbandingan`
                  : compareDisabled
                    ? "Maksimal 3 supplier untuk dibandingkan"
                    : `Tambah ${supplier.name} ke perbandingan`
              }
              title={isInCompare ? "Hapus dari perbandingan" : compareDisabled ? "Maksimal 3 supplier" : "Tambah ke perbandingan"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg border transition-colors duration-150",
                isInCompare
                  ? "border-accent bg-accent text-on-primary hover:bg-accent-hover"
                  : compareDisabled
                    ? "cursor-not-allowed border-line text-line-strong"
                    : "border-line text-accent hover:border-accent hover:bg-accent-soft"
              )}
            >
              {isInCompare ? <Check className="h-4 w-4" aria-hidden="true" /> : <GitCompare className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
