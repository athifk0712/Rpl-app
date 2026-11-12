import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, ShieldCheck, Phone, Mail, MessageCircle,
  Clock, Package, Truck, ChevronLeft, GitCompare, AlertTriangle, CheckCircle2, FileText
} from "lucide-react";
import CostEstimator from "@/components/supplier/CostEstimator";
import QuoteRequestForm from "@/components/supplier/QuoteRequestForm";
import { finalPrice } from "@/lib/pricing";
import { connection } from "next/server";
import { getSupplierById } from "@/server/supplier-service";
import { formatRupiah, getStockBadgeClass, getStockLabel } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const supplier = await getSupplierById((await params).id);
  if (!supplier) return { title: "Supplier tidak ditemukan" };
  const description = `${supplier.name} — ${supplier.city}, ${supplier.province}. ${supplier.description}`.slice(0, 200);
  return { title: supplier.name, description, openGraph: { title: supplier.name, description } };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
        <span>/</span>
        <Link href="/suppliers" className="hover:text-blue-600 transition-colors">Supplier</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{supplier.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {supplier.logo}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{supplier.name}</h1>
                  {supplier.verified ? (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Belum Terverifikasi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {supplier.location}, {supplier.city}, {supplier.province}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mx-auto mb-1" />
                <div className="font-bold text-gray-900">{supplier.rating}</div>
                <div className="text-xs text-gray-500">{supplier.reviewCount} ulasan</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900 text-sm">{supplier.responseTime}</div>
                <div className="text-xs text-gray-500">Waktu respons</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900 text-sm">{formatRupiah(supplier.minOrderValue)}</div>
                <div className="text-xs text-gray-500">Min. Order</div>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">{supplier.description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {supplier.categories.map((c) => (
                <span key={c} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>

          {/* Product list */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daftar Produk ({supplier.products.length})</h2>
            <div className="space-y-3">
              {supplier.products.map((sp) => {
                const { product } = sp;
                return (
                  <div key={sp.productId} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.category} · Min. {sp.minOrderQty} {product.unit}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 text-sm">
                        {formatRupiah(finalPrice(sp))}<span className="text-xs font-normal text-gray-500">/{product.unit}</span>
                      </div>
                      {sp.discount && (
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs line-through text-gray-400">{formatRupiah(sp.pricePerUnit)}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">-{sp.discount}%</span>
                        </div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStockBadgeClass(sp.stock)}`}>
                        {getStockLabel(sp.stock)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Opsi Pengiriman</h2>
            <div className="space-y-2">
              {supplier.shippingOptions.map((option) => (
                <div key={option} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {option}
                </div>
              ))}
            </div>
            {Object.keys(supplier.shippingCost).length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Estimasi Ongkir:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(supplier.shippingCost).map(([zone, cost]) => (
                    <div key={zone} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between text-xs">
                      <span className="text-gray-600 capitalize">{zone.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-gray-800">{formatRupiah(cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cost estimate */}
          <section id="estimasi" className="bg-white rounded-2xl border border-gray-200 p-6 scroll-mt-20">
            <h2 className="text-lg font-bold text-gray-900">Estimasi Biaya Pembelian</h2>
            <p className="mt-1 mb-5 text-sm text-gray-600">
              Hitung harga setelah diskon ditambah ongkos kirim, sekaligus cek syarat minimum order supplier.
            </p>
            <CostEstimator supplier={supplier} />
          </section>

          {/* Quote request */}
          <section id="penawaran" className="bg-white rounded-2xl border border-gray-200 p-6 scroll-mt-20">
            <h2 className="text-lg font-bold text-gray-900">Minta Penawaran Harga</h2>
            <p className="mt-1 mb-5 text-sm text-gray-600">
              Kirim kebutuhan Anda ke {supplier.name}. Permintaan disimpan dan dapat dipantau di halaman Permintaan.
            </p>
            <QuoteRequestForm supplierId={supplier.id} offers={supplier.products} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">Hubungi Supplier</h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{supplier.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="#penawaran"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> Minta Penawaran
              </a>
              <a
                href={`https://wa.me/${supplier.whatsapp}?text=Halo, saya dari SupplierHub dan tertarik dengan produk dari ${supplier.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Sekarang
              </a>
              <a
                href={`mailto:${supplier.email}?subject=Permintaan Penawaran dari SupplierHub`}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-3 rounded-xl transition-colors text-sm"
              >
                <Mail className="w-4 h-4" /> Kirim Email
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/compare?ids=${supplier.id}`}
                className="w-full flex items-center justify-center gap-2 border border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <GitCompare className="w-4 h-4" /> Tambah ke Perbandingan
              </Link>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">Info Supplier</h4>
            <div className="space-y-2 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Bergabung sejak</span>
                <span className="font-medium">{supplier.joinedYear}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium ${supplier.verified ? "text-blue-700" : "text-gray-600"}`}>
                  {supplier.verified ? "Terverifikasi ✓" : "Belum Terverifikasi"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min. Order</span>
                <span className="font-medium">{formatRupiah(supplier.minOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Respons</span>
                <span className="font-medium">{supplier.responseTime}</span>
              </div>
            </div>
          </div>

          {/* Back button */}
          <Link
            href="/suppliers"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Supplier
          </Link>
        </div>
      </div>
    </div>
  );
}
