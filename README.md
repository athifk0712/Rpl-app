# SupplierHub — Pencarian & Perbandingan Supplier Bahan Baku untuk UMKM

Aplikasi web full-stack untuk membantu UMKM mencari supplier/grosir bahan baku, membandingkan penawaran,
dan mengirim permintaan penawaran harga (RFQ).

Judul proyek RPL: **Platform Pencarian dan Perbandingan Supplier Bahan Baku bagi Pelaku UMKM**.

## Stack

* Next.js 16 (App Router) — halaman React + REST API (Route Handlers) dalam satu proyek
* TypeScript, Tailwind CSS 4, lucide-react
* Prisma 7 + SQLite (driver adapter `better-sqlite3`)
* Vitest untuk acceptance test

## Fitur MVP

Alur pengadaan UMKM: **cari → bandingkan → estimasi biaya → minta penawaran → pantau status**.

| User story | Halaman | API / modul | Unit test |
| ---------- | ------- | ----------- | --------- |
| US1. Mencari & memfilter supplier | `/`, `/suppliers`, `/suppliers/[id]` | `GET /api/suppliers`, `GET /api/suppliers/:id` | `tests/supplier-search.test.ts` |
| US2. Membandingkan supplier (maks. 3) | `/compare?ids=` | `src/lib/compare.ts` | `tests/compare.test.ts` |
| US3. Estimasi biaya pembelian + ongkir | `/suppliers/[id]` | `src/lib/cost-estimate.ts` | `tests/cost-estimate.test.ts` |
| US4. Permintaan penawaran (RFQ) | form di `/suppliers/[id]` | `POST /api/quote-requests` | `tests/quote-request.test.ts` |
| US5. Status RFQ (balas, terima, tolak, batal) | `/permintaan` | `GET/PATCH /api/quote-requests/:id` | `tests/quote-status.test.ts` |

Detail acceptance criteria dan status pengujian: [checklist_mvp.md](checklist_mvp.md).

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
npm test                    # 30 unit test di 5 file (memakai prisma/test.db terpisah)
npm run lint
npm run build && npm start  # build & jalankan mode produksi
npm run db:seed             # reset isi database ke data contoh
npm run db:migrate          # buat migrasi baru setelah mengubah prisma/schema.prisma
npx prisma studio           # lihat isi database di browser
```

> Setelah mengubah `schema.prisma` dan menjalankan migrasi/generate, **restart `npm run dev`**.
> Dev server menyimpan instance PrismaClient lama sehingga model baru belum dikenali.

## Dokumentasi

* [HowToRun.md](HowToRun.md) — petunjuk lengkap menjalankan aplikasi, test, dan skenario demo
* [checklist_mvp.md](checklist_mvp.md) — checklist fitur MVP + status unit test
* [demo.mp4](demo.mp4) — video demo alur lengkap

* [ARCHITECTURE.md](ARCHITECTURE.md) — arsitektur, model data, API, alur data
* [docs/LAPORAN-P5.md](docs/LAPORAN-P5.md) — proses Brief → Plan → Build → Verify → Commit per fitur
* [docs/evidence/](docs/evidence/) — bukti verifikasi (log request API)
