# Laporan Tugas Pertemuan 5 — MVP Version 1 (Iteratif dengan AI Agent)

Proyek: **SupplierHub** — Platform Pencarian dan Perbandingan Supplier Bahan Baku bagi Pelaku UMKM
AI Agent: Claude Code
Repositori: branch `main`

## Ringkasan Commit

| # | Commit | Isi |
| - | ------ | --- |
| 0 | `chore: baseline UI redesign dan dokumen arsitektur v1` | Titik awal: UI frontend-only dengan mock data |
| 1 | `feat: pencarian & filter supplier dari database (Prisma + SQLite + REST API)` | **Fitur 1** |
| 2 | `feat: permintaan penawaran (RFQ) dari UMKM ke supplier` | **Fitur 2** |
| 3 | `docs: README, arsitektur full-stack, dan laporan P5` | Dokumentasi |

Lihat detail dengan `git log --stat` atau `git show <hash>`.

## Pemilihan 2 Fitur Inti

Judul proyek menekankan **pencarian** dan **perbandingan** supplier, serta **pengadaan** bahan baku. Dua fitur yang dipilih:

1. **Pencarian & filter supplier dari database.** Inti produk: tanpa ini UMKM tidak bisa menemukan supplier.
   Sebelumnya data hanya array di kode; fitur ini memindahkan data ke database dan pencarian ke server.
2. **Permintaan penawaran (RFQ).** Langkah setelah menemukan dan membandingkan supplier: UMKM meminta harga.
   Ini fitur pertama yang **menulis** data, sehingga menguji alur full-stack lengkap (form → API → validasi → DB → tampil).

---

## Fitur 1 — Pencarian & Filter Supplier dari Database

### Brief
UMKM mencari supplier berdasarkan kata kunci (nama bahan/supplier/kategori), kategori, provinsi, dan harga maksimum,
lalu mengurutkan hasil. Data harus berasal dari database lewat REST API, bukan array di kode.

### Acceptance Criteria
| ID | Kriteria |
| -- | -------- |
| AC1 | Tanpa filter, semua supplier hasil seed tampil beserta produk dan ongkirnya |
| AC2 | Kata kunci cocok ke nama supplier, nama produk, atau kategori; tidak peka huruf besar/kecil |
| AC3 | Filter kategori, provinsi, harga maksimum digabung (AND) |
| AC4 | Hasil terurut sesuai parameter `sort` |
| AC5 | `GET /api/suppliers` mengembalikan JSON; parameter tidak valid → 400 dengan pesan Indonesia |
| AC6 | `GET /api/suppliers/:id` mengembalikan detail; id tidak ada → 404 |

### Plan
1. Pasang Prisma 7 + SQLite (Docker tidak tersedia di laptop).
2. Rancang skema dari tipe `Supplier`/`Product` yang sudah ada; buat migrasi `init_supplier_catalog`.
3. Pindahkan mock data menjadi data seed.
4. Buat `supplier-service.ts` (query + mapping ke tipe domain) dan Route Handler API.
5. Ubah halaman agar membaca dari API/service; tambah state loading & error.
6. Tulis acceptance test, jalankan, kumpulkan bukti, commit.

### Build (yang dikerjakan AI Agent)
* `prisma/schema.prisma`, migrasi, `prisma/seed.ts`, `prisma.config.ts`, `.env.example`
* `src/server/db.ts`, `src/server/supplier-service.ts`
* `src/app/api/suppliers/route.ts`, `src/app/api/suppliers/[id]/route.ts`
* Perubahan halaman `/`, `/suppliers`, `/suppliers/[id]`, `/compare` (dipecah jadi `page.tsx` server + `CompareClient.tsx`)
* `tests/supplier-search.test.ts`, `vitest.config.mts`, `tests/global-setup.ts`

### Verify
* `npm test` → 6/6 test Fitur 1 lulus. Hasil pencarian dari database **dibandingkan dengan logika pencarian versi 1**
  (mock data) untuk berbagai kombinasi filter, membuktikan perilaku tidak berubah setelah migrasi ke database.
* `npm run lint` bersih, `npm run build` berhasil.
* Log request nyata ke server: [`evidence/fitur-1-api.txt`](evidence/fitur-1-api.txt).

---

## Fitur 2 — Permintaan Penawaran (RFQ)

### Brief
Dari halaman detail supplier, UMKM mengisi form (produk, jumlah, nama usaha, nama kontak, WhatsApp, catatan).
Data divalidasi di server dan disimpan. Riwayat permintaan dapat dilihat di halaman `/permintaan`.

### Acceptance Criteria
| ID | Kriteria |
| -- | -------- |
| AC1 | Data valid tersimpan (201), mendapat nomor `RFQ-xxxxx`, estimasi total dari harga **setelah diskon** |
| AC2 | Field wajib & format nomor WhatsApp divalidasi; pesan error per field dalam Bahasa Indonesia |
| AC3 | Jumlah di bawah minimum order produk ditolak |
| AC4 | Produk yang tidak dijual supplier, atau stoknya habis, ditolak |
| AC5 | Supplier tidak ada → 404; body bukan JSON → 400 |
| AC6 | Daftar permintaan terbaru di atas dan bisa difilter per supplier |

### Plan
1. Tambah model `QuoteRequest` + migrasi `add_quote_request`.
2. `quote-service.ts`: `parseQuoteInput` (validasi bentuk data, tanpa DB) dan `createQuoteRequest`
   (aturan bisnis yang butuh DB), `listQuoteRequests`.
3. `POST`/`GET /api/quote-requests`.
4. Komponen `QuoteRequestForm` di halaman detail, halaman `/permintaan`, link navigasi.
5. Test, bukti, commit.

### Build (yang dikerjakan AI Agent)
* `prisma/schema.prisma` (model `QuoteRequest`), migrasi
* `src/server/quote-service.ts`, `src/app/api/quote-requests/route.ts`
* `src/components/supplier/QuoteRequestForm.tsx`, `src/app/permintaan/page.tsx`, perubahan `Header.tsx` dan halaman detail
* `tests/quote-request.test.ts`

### Verify
* `npm test` → **12/12 test lulus** (6 Fitur 1 + 6 Fitur 2).
* Diuji terhadap **build produksi** (`npm run build` lalu `next start`): [`evidence/fitur-2-api.txt`](evidence/fitur-2-api.txt)
  berisi respons 201, 400 (per field), 404, dan daftar permintaan.

---

## Masalah yang Ditemukan & Cara Memperbaikinya

Bagian ini mencatat kendala nyata selama build, sesuai arahan "identifikasi penyebab → perbaiki → uji ulang".

| # | Gejala | Penyebab | Perbaikan |
| - | ------ | -------- | --------- |
| 1 | Docker tidak ada di laptop | Rencana awal (MySQL di Docker) tidak bisa dijalankan | Pakai SQLite: database berupa file, tanpa server |
| 2 | Error TypeScript di Route Handler saat `Response.json<T>()` | `Response.json` bawaan DOM tidak menerima generic | Ganti ke `NextResponse.json<T>()` |
| 3 | Edit otomatis pada beberapa file tidak berpengaruh | File di working copy memakai line ending CRLF (Windows) | Normalisasi ke LF (git tetap menyimpan LF) |
| 4 | `const products = products.filter(...)` di beranda | Variabel menimpa dirinya sendiri (bug shadowing) saat refactor | Ganti nama menjadi `inCategory` |
| 5 | Build akan gagal setelah `mock-data.ts` dipindah | `/compare` (Client Component) masih mengimpor mock data | Pecah jadi `page.tsx` (server, ambil data dari DB) + `CompareClient.tsx` |
| 6 | `npm install vitest` gagal (ERESOLVE) | Vitest 5 butuh `@types/node` ≥ 22, proyek pakai v20 | Naikkan `@types/node` ke ^24 sesuai Node yang terpasang (v24) |
| 7 | `POST /api/quote-requests` → **500** di dev server | Dev server yang sudah berjalan menyimpan PrismaClient lama di `globalThis`, belum kenal model `QuoteRequest` (`Cannot read properties of undefined (reading 'create')`) | Restart `npm run dev` setelah `prisma generate`; diverifikasi ulang di build produksi → 201 |

## Cara Menjalankan Ulang Verifikasi

```bash
npm install
cp .env.example .env
npm run db:setup
npm test          # harus: Test Files 2 passed, Tests 12 passed
npm run lint
npm run build
npm run dev       # buka http://localhost:3000
```

Skenario demo singkat (± 3 menit):

1. **Beranda** → klik kata kunci populer "Tepung terigu".
2. **/suppliers** → tampil 3 supplier. Tambah filter provinsi "Jawa Barat" → hasil berkurang.
   Ganti urutan ke "Ulasan terbanyak". Ketik kata acak (mis. "xyz") → empty state.
3. Pilih 2 supplier dengan ikon bandingkan → **Bandingkan sekarang** → tabel perbandingan.
4. Buka detail **PT Surya Bahan Industri** → klik **Minta Penawaran**.
   * Kirim form kosong → pesan error merah di setiap field.
   * Pilih "Tepung Terigu Protein Tinggi", jumlah 50 → error minimum order 100 kg.
   * Jumlah 150, isi nama & WhatsApp → sukses, muncul nomor `RFQ-…` dan estimasi total.
5. Menu **Permintaan** → permintaan baru tampil paling atas; coba filter supplier.
6. Terminal: `npm test` → 12 test lulus.

---

## Pembagian Peran: AI Agent vs Mahasiswa

### Yang dikerjakan AI Agent
* Mengusulkan pemilihan fitur, acceptance criteria, dan rencana per fitur.
* Menulis kode backend, frontend, migrasi, seed, dan test.
* Menjalankan lint/build/test, membaca log error, dan memperbaiki masalah pada tabel di atas.
* Menulis draft dokumentasi dan diagram.

### Yang direview dan diubah mahasiswa
> **Wajib diisi sendiri** sebelum dikumpulkan. Tulis apa yang benar-benar Anda periksa/ubah.

| Bagian | Apa yang direview | Perubahan yang dibuat (jika ada) |
| ------ | ----------------- | -------------------------------- |
| Skema database (`prisma/schema.prisma`) | | |
| Aturan validasi RFQ (`src/server/quote-service.ts`) | | |
| Acceptance criteria & test | | |
| Tampilan UI (form, halaman permintaan) | | |

Saran hal yang perlu dipahami agar bisa menjelaskan saat demo:
* Kenapa `SupplierProduct` memakai primary key gabungan dan apa artinya.
* Beda Server Component (beranda, detail) dan Client Component (`/suppliers`, form RFQ), dan kenapa form RFQ memanggil API.
* Kenapa validasi ada di server walaupun form juga bisa memvalidasi (client bisa dilewati, mis. lewat curl).
* Kenapa `unitPrice` disimpan sebagai snapshot di `QuoteRequest`.
* Alur satu request dari klik tombol sampai baris tersimpan di SQLite (lihat diagram di ARCHITECTURE.md bagian 8).

### Mengapa perubahan ini diperlukan
* **Database + API**: data di kode tidak bisa bertambah tanpa mengubah kode dan deploy ulang;
  database memungkinkan data berubah saat aplikasi berjalan dan menjadi dasar fitur tulis seperti RFQ.
* **Pencarian di server**: jumlah supplier bisa bertambah; memfilter di database lebih efisien daripada
  mengirim semua data ke browser.
* **RFQ**: tanpanya, aplikasi hanya direktori. RFQ menjadikan aplikasi bagian dari proses pengadaan UMKM
  dan menyimpan jejak permintaan.
* **Acceptance test**: membuktikan setiap kriteria terpenuhi dan menjaga agar perubahan berikutnya tidak merusak fitur.
