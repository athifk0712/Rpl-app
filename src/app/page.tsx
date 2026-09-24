import Link from "next/link";
import {
  Search, GitCompare, ShieldCheck, TrendingUp, MapPin,
  Star, ArrowRight, Package, Boxes, Shirt, Sandwich
} from "lucide-react";
import { SUPPLIERS, PRODUCTS } from "@/data/mock-data";
import { formatRupiah } from "@/lib/utils";

const HERO_STATS = [
  { label: "Supplier Terdaftar", value: "10+", icon: Package },
  { label: "Produk Tersedia", value: "22+", icon: Boxes },
  { label: "Rata-rata Rating", value: "4.6★", icon: Star },
  { label: "Kota Terjangkau", value: "8+", icon: MapPin },
];

const CATEGORY_CARDS = [
  { name: "Bahan Pangan", icon: Sandwich, count: 10, color: "from-orange-400 to-amber-500", bg: "bg-orange-50" },
  { name: "Tekstil & Kain", icon: Shirt, count: 4, color: "from-purple-400 to-violet-500", bg: "bg-purple-50" },
  { name: "Kemasan", icon: Boxes, count: 5, color: "from-teal-400 to-cyan-500", bg: "bg-teal-50" },
  { name: "Bumbu & Rempah", icon: Package, count: 4, color: "from-red-400 to-rose-500", bg: "bg-red-50" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Cari Bahan Baku", desc: "Ketik nama bahan baku atau pilih kategori yang kamu butuhkan.", icon: Search },
  { step: "2", title: "Filter & Bandingkan", desc: "Filter berdasarkan lokasi dan harga, lalu pilih 2–3 supplier untuk dibandingkan.", icon: GitCompare },
  { step: "3", title: "Hubungi Supplier", desc: "Pilih supplier terbaik dan langsung hubungi via WhatsApp atau email.", icon: ShieldCheck },
];

export default function HomePage() {
  const featuredSuppliers = SUPPLIERS.filter((s) => s.verified).slice(0, 3);
  const featuredProducts = PRODUCTS.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <TrendingUp className="w-4 h-4" />
              Platform #1 Pencarian Supplier UMKM Indonesia
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Temukan Supplier Terbaik untuk{" "}
              <span className="text-yellow-300">UMKM</span> Anda
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Bandingkan harga, cek lokasi, dan hubungi langsung ratusan supplier bahan baku terpercaya — semua dalam satu platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/suppliers"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                <Search className="w-4 h-4" /> Mulai Mencari
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 border-2 border-white/60 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                <GitCompare className="w-4 h-4" /> Bandingkan Supplier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HERO_STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jelajahi Kategori</h2>
            <p className="text-gray-500 text-sm mt-1">Temukan supplier berdasarkan jenis bahan baku yang Anda butuhkan</p>
          </div>
          <Link href="/suppliers" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
            Lihat semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORY_CARDS.map(({ name, icon: Icon, count, color, bg }) => (
            <Link
              key={name}
              href={`/suppliers?category=${encodeURIComponent(name)}`}
              className={`${bg} rounded-2xl p-5 hover:shadow-md transition-all group`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold text-gray-800 text-sm">{name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{count} produk</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Suppliers */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Supplier Unggulan</h2>
              <p className="text-gray-500 text-sm mt-1">Supplier terverifikasi dengan rating terbaik</p>
            </div>
            <Link href="/suppliers" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredSuppliers.map((s) => (
              <Link key={s.id} href={`/suppliers/${s.id}`} className="block p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {s.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                      {s.verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> {s.city}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-sm text-gray-800">{s.rating}</span>
                  <span className="text-xs text-gray-500">({s.reviewCount} ulasan)</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{s.description}</p>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {s.categories.map((c) => (
                    <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Produk Populer</h2>
            <p className="text-gray-500 text-sm mt-1">Bahan baku yang paling banyak dicari UMKM</p>
          </div>
          <Link href="/suppliers" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
            Lihat semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredProducts.map((p) => {
            const supplierPrices = SUPPLIERS
              .filter((s) => s.products.some((sp) => sp.productId === p.id))
              .map((s) => s.products.find((sp) => sp.productId === p.id)!.pricePerUnit);
            const lowestPrice = supplierPrices.length > 0 ? Math.min(...supplierPrices) : 0;
            return (
              <Link
                key={p.id}
                href={`/suppliers?query=${encodeURIComponent(p.name)}`}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all text-center"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1">{p.name}</div>
                <div className="text-xs text-gray-500">{p.category}</div>
                {lowestPrice > 0 && (
                  <div className="mt-2 text-xs font-semibold text-green-600">
                    ab {formatRupiah(lowestPrice)}/{p.unit}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Cara Kerja SupplierHub</h2>
            <p className="text-gray-400 text-sm mt-2">Tiga langkah mudah untuk menemukan supplier ideal Anda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-400 mb-1">LANGKAH {step}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <Search className="w-5 h-5" /> Mulai Sekarang
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
