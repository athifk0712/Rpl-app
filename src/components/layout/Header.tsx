"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Search, GitCompare, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Beranda", icon: null },
  { href: "/suppliers", label: "Cari Supplier", icon: Search },
  { href: "/compare", label: "Bandingkan", icon: GitCompare },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-gray-900 text-lg">SupplierHub</span>
              <span className="hidden sm:block text-xs text-gray-500 -mt-0.5">Platform Supplier UMKM</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/suppliers"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              Cari Bahan Baku
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
