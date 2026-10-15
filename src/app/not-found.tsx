import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-ink-muted">Supplier atau halaman yang Anda cari tidak ada atau sudah dihapus.</p>
      <Link
        href="/suppliers"
        className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Kembali ke daftar supplier
      </Link>
    </div>
  );
}
