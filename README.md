# SupplierHub — Pencarian & Perbandingan Supplier Bahan Baku untuk UMKM

Aplikasi web full-stack untuk membantu UMKM mencari supplier/grosir bahan baku, membandingkan penawaran,
dan mengirim permintaan penawaran harga (RFQ).

Judul proyek RPL: **Platform Pencarian dan Perbandingan Supplier Bahan Baku bagi Pelaku UMKM**.

## Stack

* Next.js 16 (App Router) — halaman React + REST API (Route Handlers) dalam satu proyek
* TypeScript, Tailwind CSS 4, lucide-react
* Prisma 7 + SQLite (driver adapter `better-sqlite3`)
* Vitest untuk acceptance test

## Fitur MVP v1

| Fitur | Halaman | API |
| ----- | ------- | --- |
| 1. Pencarian & filter supplier dari database | `/suppliers`, `/suppliers/[id]`, `/`, `/compare` | `GET /api/suppliers`, `GET /api/suppliers/:id` |
| 2. Permintaan penawaran (RFQ) | form di `/suppliers/[id]`, `/permintaan` | `POST /api/quote-requests`, `GET /api/quote-requests` |

## Menjalankan

Prasyarat: Node.js 20+ (diuji dengan Node 24) dan npm. Tidak perlu Docker atau server database.

```bash
npm install                 # juga menjalankan `prisma generate`
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run db:setup            # buat database prisma/dev.db dari migrasi + isi data contoh
npm run dev                 # http://localhost:3000
```

Perintah lain:

```bash
npm test                    # 12 acceptance test (memakai prisma/test.db terpisah)
npm run lint
npm run build && npm start  # build & jalankan mode produksi
npm run db:seed             # reset isi database ke data contoh
npm run db:migrate          # buat migrasi baru setelah mengubah prisma/schema.prisma
npx prisma studio           # lihat isi database di browser
```

> Setelah mengubah `schema.prisma` dan menjalankan migrasi/generate, **restart `npm run dev`**.
> Dev server menyimpan instance PrismaClient lama sehingga model baru belum dikenali.

## Dokumentasi

* [ARCHITECTURE.md](ARCHITECTURE.md) — arsitektur, model data, API, alur data
* [docs/LAPORAN-P5.md](docs/LAPORAN-P5.md) — proses Brief → Plan → Build → Verify → Commit per fitur
* [docs/evidence/](docs/evidence/) — bukti verifikasi (log request API)
