import { Store, Mail, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">SupplierHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Platform pencarian dan perbandingan supplier bahan baku terpercaya untuk UMKM Indonesia. Temukan supplier terbaik, bandingkan harga, dan kelola pengadaan bahan baku lebih efisien.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Fitur</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/suppliers" className="hover:text-white transition-colors">Cari Supplier</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Bandingkan Harga</Link></li>
              <li><Link href="/suppliers" className="hover:text-white transition-colors">Katalog Produk</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@supplierhub.id</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0800-1234-5678</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
          © 2024 SupplierHub. Dibuat untuk membantu UMKM Indonesia berkembang.
        </div>
      </div>
    </footer>
  );
}
