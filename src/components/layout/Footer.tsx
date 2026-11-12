import { Store, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { currentYear } from "@/lib/utils";

const FEATURE_LINKS = [
  { href: "/suppliers", label: "Cari Supplier" },
  { href: "/compare", label: "Bandingkan Harga" },
  { href: "/suppliers", label: "Katalog Produk" },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-primary text-on-primary-muted">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-on-primary">
                <Store className="h-4 w-4 text-primary" aria-hidden="true" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-on-primary">SupplierHub</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Platform pencarian dan perbandingan supplier bahan baku untuk UMKM Indonesia. Temukan supplier,
              bandingkan harga, dan kelola pengadaan bahan baku lebih efisien.
            </p>
          </div>

          <nav aria-label="Fitur" className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-on-primary">Fitur</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {FEATURE_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="rounded-sm transition-colors hover:text-on-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-on-primary">Kontak</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="mailto:info@supplierhub.id" className="inline-flex items-center gap-2 rounded-sm transition-colors hover:text-on-primary">
                  <Mail className="h-4 w-4" aria-hidden="true" /> info@supplierhub.id
                </a>
              </li>
              <li>
                <a href="tel:080012345678" className="inline-flex items-center gap-2 rounded-sm transition-colors hover:text-on-primary">
                  <Phone className="h-4 w-4" aria-hidden="true" /> 0800-1234-5678
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-soft pt-6 text-xs">
          © {currentYear()} SupplierHub. Dibuat untuk membantu UMKM Indonesia berkembang.
        </div>
      </div>
    </footer>
  );
}
