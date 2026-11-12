import type { Metadata } from "next";

// Halaman daftar supplier adalah client component, jadi judulnya diatur di layout ini.
export const metadata: Metadata = {
  title: { default: "Cari Supplier", template: "%s · SupplierHub" },
};

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
