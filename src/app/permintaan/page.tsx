import Link from "next/link";
import { connection } from "next/server";
import { FileText } from "lucide-react";
import QuoteStatusActions from "@/components/quote/QuoteStatusActions";
import { isQuoteStatus, QUOTE_STATUSES, STATUS_LABEL } from "@/lib/quote-status";
import { listQuoteRequests } from "@/server/quote-service";
import { searchSuppliers } from "@/server/supplier-service";
import { formatRupiah } from "@/lib/utils";
import type { QuoteStatus } from "@/types";

const STATUS_CLASS: Record<QuoteStatus, string> = {
  BARU: "bg-blue-100 text-blue-700",
  DIBALAS: "bg-amber-100 text-amber-800",
  DITERIMA: "bg-green-100 text-green-700",
  DITOLAK: "bg-red-100 text-red-700",
  DIBATALKAN: "bg-gray-200 text-gray-700",
};

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function QuoteRequestsPage({ searchParams }: PageProps<"/permintaan">) {
  await connection();
  const { supplier, status: statusParam } = await searchParams;
  const supplierId = typeof supplier === "string" && supplier ? supplier : undefined;
  const status = isQuoteStatus(statusParam) ? statusParam : undefined;
  const [quotes, suppliers] = await Promise.all([listQuoteRequests({ supplierId, status }), searchSuppliers()]);
  const activeSupplier = suppliers.find((s) => s.id === supplierId);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="text-sm font-semibold text-accent">Pengadaan</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">Permintaan penawaran</h1>
          <p className="mt-2 text-base text-ink-muted">
            Riwayat permintaan penawaran harga yang dikirim ke supplier, terbaru di atas.
          </p>

          <form className="mt-6 flex max-w-2xl flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-ink">Filter supplier</label>
              <select
                id="supplier"
                name="supplier"
                defaultValue={supplierId ?? ""}
                className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
              >
                <option value="">Semua supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-40">
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
              >
                <option value="">Semua status</option>
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
              Terapkan
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold tabular-nums text-ink">{quotes.length}</span> permintaan
          {activeSupplier && <> untuk <span className="font-semibold text-ink">{activeSupplier.name}</span></>}
          {status && <> berstatus <span className="font-semibold text-ink">{STATUS_LABEL[status]}</span></>}
        </p>

        {quotes.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">
              {supplierId || status ? "Tidak ada permintaan yang cocok dengan filter" : "Belum ada permintaan penawaran"}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Buka halaman detail supplier lalu isi formulir “Minta Penawaran Harga”.
            </p>
            <Link
              href="/suppliers"
              className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Cari supplier
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">No. referensi</th>
                  <th scope="col" className="px-4 py-3">Tanggal</th>
                  <th scope="col" className="px-4 py-3">Supplier</th>
                  <th scope="col" className="px-4 py-3">Produk</th>
                  <th scope="col" className="px-4 py-3">Pemohon</th>
                  <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                  <th scope="col" className="px-4 py-3 text-right">Estimasi total</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {quotes.map((q) => (
                  <tr key={q.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{q.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{dateFormat.format(new Date(q.createdAt))}</td>
                    <td className="px-4 py-3">
                      <Link href={`/suppliers/${q.supplierId}`} className="font-medium text-ink hover:text-accent">
                        {q.supplierName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {q.productName}
                      {q.note && <p className="mt-1 max-w-xs text-xs text-ink-subtle">“{q.note}”</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      <span className="text-ink">{q.businessName}</span>
                      <br />
                      {q.contactName} · {q.phone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{q.quantity} {q.unit}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">
                      <span className="font-semibold">{formatRupiah(q.estimatedTotal)}</span>
                      {q.offeredTotal !== null && (
                        <p className="mt-1 text-xs text-amber-800">
                          Penawaran: {formatRupiah(q.offeredTotal)}
                          <br />({formatRupiah(q.offeredPrice!)}/{q.unit})
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[q.status]}`}>
                        {STATUS_LABEL[q.status]}
                      </span>
                      {q.replyNote && <p className="mt-2 max-w-[14rem] text-xs text-ink-subtle">Balasan: “{q.replyNote}”</p>}
                      <QuoteStatusActions quote={q} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
