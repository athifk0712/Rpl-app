import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, Wheat, Shirt, Package, Leaf, type LucideIcon } from "lucide-react";
import { SUPPLIERS, PRODUCTS } from "@/data/mock-data";
import { formatRupiah } from "@/lib/utils";
import SupplierCard from "@/components/supplier/SupplierCard";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Bahan Pangan": Wheat,
  "Tekstil & Kain": Shirt,
  "Kemasan": Package,
  "Bumbu & Rempah": Leaf,
};

const POPULAR_SEARCHES = ["Tepung terigu", "Kain cotton", "Standing pouch", "Bawang merah"];

const STEPS = [
  { title: "Cari bahan baku", desc: "Ketik nama bahan atau pilih kategori. Hasil langsung menampilkan supplier yang menjualnya." },
  { title: "Bandingkan penawaran", desc: "Pilih hingga 3 supplier dan lihat harga, minimum order, dan ongkos kirim berdampingan." },
  { title: "Hubungi langsung", desc: "Tidak ada perantara. Kirim pesan ke supplier pilihan lewat WhatsApp atau email." },
];

// Lowest/highest price and number of suppliers offering each product
const PRICE_BOARD = PRODUCTS.map((product) => {
  const prices = SUPPLIERS.flatMap((s) =>
    s.products.filter((sp) => sp.productId === product.id).map((sp) => sp.pricePerUnit)
  );
  return {
    product,
    supplierCount: prices.length,
    lowest: prices.length ? Math.min(...prices) : 0,
    highest: prices.length ? Math.max(...prices) : 0,
  };
})
  .filter((row) => row.supplierCount > 0)
  .sort((a, b) => b.supplierCount - a.supplierCount)
  .slice(0, 6);

const CATEGORY_SUMMARY = Object.keys(CATEGORY_ICONS).map((name) => {
  const products = PRODUCTS.filter((p) => p.category === name);
  return {
    name,
    icon: CATEGORY_ICONS[name],
    productCount: products.length,
    supplierCount: SUPPLIERS.filter((s) => s.categories.includes(name)).length,
    examples: products.slice(0, 3).map((p) => p.name),
  };
});

const STATS = [
  { value: SUPPLIERS.length, label: "Supplier terdaftar", note: `${SUPPLIERS.filter((s) => s.verified).length} terverifikasi` },
  { value: PRODUCTS.length, label: "Jenis bahan baku", note: `${CATEGORY_SUMMARY.length} kategori utama` },
  { value: new Set(SUPPLIERS.map((s) => s.city)).size, label: "Kota asal supplier", note: `${new Set(SUPPLIERS.map((s) => s.province)).size} provinsi` },
  {
    value: (SUPPLIERS.reduce((sum, s) => sum + s.rating, 0) / SUPPLIERS.length).toFixed(1),
    label: "Rata-rata rating",
    note: `dari ${SUPPLIERS.reduce((sum, s) => sum + s.reviewCount, 0).toLocaleString("id-ID")} ulasan`,
  },
];

function SectionHeader({ eyebrow, title, description, href, linkLabel }: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-base text-ink-muted">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group inline-flex flex-shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-ink transition-colors hover:text-accent"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const featuredSuppliers = SUPPLIERS.filter((s) => s.verified)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 lg:self-center">
              <p className="text-sm font-semibold text-accent">Direktori supplier bahan baku untuk UMKM</p>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.5rem]">
                Beli bahan baku langsung dari supplier terverifikasi.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
                Bandingkan harga per unit, minimum order, dan lokasi dari supplier di seluruh Indonesia, lalu hubungi
                mereka tanpa perantara.
              </p>

              <form action="/suppliers" method="get" role="search" className="mt-8 max-w-xl">
                <label htmlFor="hero-query" className="sr-only">Cari bahan baku atau supplier</label>
                <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface p-1.5 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                  <Search className="ml-2.5 h-5 w-5 flex-shrink-0 text-ink-subtle" aria-hidden="true" />
                  <input
                    id="hero-query"
                    name="query"
                    type="search"
                    placeholder="Tepung terigu, kain cotton, kemasan…"
                    className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-11 flex-shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
                  >
                    Cari
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
                <span className="mr-2 text-ink-subtle">Sering dicari:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    href={`/suppliers?query=${encodeURIComponent(term)}`}
                    className="rounded-md px-2 py-1 font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* Price board */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_48px_-24px_rgb(15_23_42/0.2)]">
                <div className="flex items-baseline justify-between gap-4 border-b border-line bg-canvas px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Harga terendah per unit</h2>
                    <p className="mt-0.5 text-xs text-ink-subtle">Bahan baku dengan pilihan supplier terbanyak</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-ink-subtle">{PRICE_BOARD.length} produk</span>
                </div>
                <ul className="divide-y divide-line">
                  {PRICE_BOARD.map(({ product, supplierCount, lowest, highest }) => (
                    <li key={product.id}>
                      <Link
                        href={`/suppliers?query=${encodeURIComponent(product.name)}`}
                        className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink group-hover:text-accent">{product.name}</p>
                          <p className="mt-0.5 text-xs text-ink-subtle">
                            {product.category} · {supplierCount} supplier
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold tabular-nums text-ink">
                            {formatRupiah(lowest)}
                            <span className="font-medium text-ink-subtle">/{product.unit}</span>
                          </p>
                          {highest > lowest && (
                            <p className="mt-0.5 text-xs tabular-nums text-ink-subtle">hingga {formatRupiah(highest)}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/suppliers"
                  className="flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
                >
                  Lihat semua bahan baku
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Proof */}
          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 lg:grid-cols-4">
            {STATS.map(({ value, label, note }) => (
              <div key={label} className="lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                <dt className="text-sm font-medium text-ink-muted">{label}</dt>
                <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink">{value}</dd>
                <dd className="mt-1 text-xs text-ink-subtle">{note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Kategori"
          title="Mulai dari jenis bahan yang Anda butuhkan"
          href="/suppliers"
          linkLabel="Semua kategori"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_SUMMARY.map(({ name, icon: Icon, productCount, supplierCount, examples }) => (
            <Link
              key={name}
              href={`/suppliers?category=${encodeURIComponent(name)}`}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[0_12px_32px_-16px_rgb(15_23_42/0.25)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-primary-soft transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="h-5 w-5 text-line-strong transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-ink">{name}</h3>
              <p className="mt-1 text-sm tabular-nums text-ink-muted">
                {productCount} produk · {supplierCount} supplier
              </p>
              <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-subtle">
                {examples.join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Supplier unggulan"
            title="Rating tertinggi dari supplier terverifikasi"
            description="Diurutkan berdasarkan ulasan pembeli UMKM."
            href="/suppliers"
            linkLabel="Lihat semua supplier"
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredSuppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold text-accent">Cara kerja</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Dari pencarian ke pemesanan dalam tiga langkah
            </h2>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {STEPS.map(({ title, desc }, i) => (
              <li key={title} className="border-t-2 border-primary pt-5">
                <span className="text-sm font-bold tabular-nums text-ink-subtle">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{desc}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col gap-8 rounded-2xl bg-primary px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
          <div className="max-w-xl">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-on-primary sm:text-3xl">
              Bandingkan hingga 3 supplier sekaligus.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-on-primary-muted">
              Lihat harga, minimum order, dan ongkos kirim berdampingan sebelum memutuskan.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/suppliers"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-surface px-6 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-canvas"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Mulai mencari
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-soft px-6 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              Buka perbandingan
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
