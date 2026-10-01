"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/suppliers", label: "Cari Supplier" },
  { href: "/compare", label: "Bandingkan" },
  { href: "/permintaan", label: "Permintaan" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 rounded-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Store className="h-4 w-4 text-on-primary" aria-hidden="true" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-ink">SupplierHub</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Navigasi utama" className="hidden h-full items-stretch gap-8 md:ml-6 md:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center text-sm font-medium transition-colors duration-150",
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                    active
                      ? "text-ink after:bg-primary"
                      : "text-ink-muted after:bg-transparent hover:text-ink"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="ml-auto hidden md:block">
            <Link
              href="/suppliers"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Cari Bahan Baku
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav id="menu-mobile" aria-label="Navigasi utama" className="border-t border-line bg-surface px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-surface-muted text-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                )}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/suppliers"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-on-primary"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Cari Bahan Baku
          </Link>
        </nav>
      )}
    </header>
  );
}
