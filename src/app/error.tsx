"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Ditampilkan jika halaman gagal dirender, misalnya database tidak bisa diakses.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">Terjadi kesalahan saat memuat halaman</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Pastikan database sudah disiapkan (<code>npm run db:setup</code>) lalu coba lagi.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Coba lagi
      </button>
    </div>
  );
}
