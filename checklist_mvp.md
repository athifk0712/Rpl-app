# Checklist MVP — SupplierHub

Proyek: **Platform Pencarian dan Perbandingan Supplier Bahan Baku bagi Pelaku UMKM**

**MVP:** UMKM dapat menyelesaikan satu alur pengadaan bahan baku dari awal sampai akhir:
**cari supplier → bandingkan → hitung estimasi biaya → minta penawaran → pantau & putuskan penawaran.**

Hasil terakhir `npm test` (15 Oktober 2026): **Test Files 5 passed (5), Tests 30 passed (30)**.
Log lengkap: [`docs/evidence/unit-test.txt`](docs/evidence/unit-test.txt). Video: [`demo.mp4`](demo.mp4).

## Ringkasan

| # | User story | Halaman / API | File unit test | Unit test | Uji manual (demo) |
| - | ---------- | ------------- | -------------- | --------- | ----------------- |
| US1 | Mencari & memfilter supplier | `/suppliers`, `GET /api/suppliers`, `GET /api/suppliers/:id` | `tests/supplier-search.test.ts` | ✅ PASSED (6/6) | ✅ |
| US2 | Membandingkan supplier | `/compare?ids=` | `tests/compare.test.ts` | ✅ PASSED (6/6) | ✅ |
| US3 | Estimasi biaya pembelian | `/suppliers/[id]` → *Estimasi Biaya Pembelian* | `tests/cost-estimate.test.ts` | ✅ PASSED (6/6) | ✅ |
| US4 | Mengirim permintaan penawaran (RFQ) | form di `/suppliers/[id]`, `POST /api/quote-requests` | `tests/quote-request.test.ts` | ✅ PASSED (6/6) | ✅ |
| US5 | Memantau & memperbarui status RFQ | `/permintaan`, `PATCH /api/quote-requests/:id` | `tests/quote-status.test.ts` | ✅ PASSED (6/6) | ✅ |
| | **Total** | | **5 file** | **✅ 30/30 PASSED** | |

---

## US1 — Mencari & memfilter supplier

> Sebagai **pemilik UMKM**, saya ingin **mencari supplier berdasarkan bahan baku, kategori, lokasi, dan harga**
> agar **saya cepat menemukan supplier yang sesuai kebutuhan usaha**.

| ID | Acceptance criteria | Status |
| -- | ------------------- | ------ |
| AC1 | Tanpa filter, semua supplier tampil beserta produk dan ongkir | ✅ PASSED |
| AC2 | Kata kunci cocok ke nama supplier, produk, atau kategori; tidak peka huruf besar/kecil | ✅ PASSED |
| AC3 | Filter kategori, provinsi, dan harga maksimum digabung (AND) | ✅ PASSED |
| AC4 | Hasil terurut sesuai pilihan (rating, ulasan, min. order) | ✅ PASSED |
| AC5 | API mengembalikan JSON; parameter tidak valid → 400 dengan pesan Indonesia | ✅ PASSED |
| AC6 | Detail supplier tersedia; id tidak ada → 404 | ✅ PASSED |

## US2 — Membandingkan supplier

> Sebagai **pemilik UMKM**, saya ingin **membandingkan hingga 3 supplier dalam satu tabel**
> agar **saya bisa memilih supplier dengan harga dan syarat terbaik**.

| ID | Acceptance criteria | Status |
| -- | ------------------- | ------ |
| AC1 | Maksimal 3 supplier; id kosong, duplikat, atau tidak dikenal di URL diabaikan | ✅ PASSED |
| AC2 | Supplier ke-4 tidak bisa ditambahkan; menekan lagi menghapus dari daftar | ✅ PASSED |
| AC3 | Harga dibandingkan **setelah diskon** (`harga × (1 − diskon%)`, dibulatkan) | ✅ PASSED |
| AC4 | "Terbaik" hanya ditandai jika ≥ 2 supplier punya nilai dan nilainya tidak sama semua | ✅ PASSED |
| AC5 | Supplier yang tidak menjual produk atau stoknya habis tidak dinilai untuk harga produk | ✅ PASSED |
| AC6 | Penanda rating & ulasan tertinggi, minimum belanja terendah; produk diurutkan dari yang paling banyak dijual | ✅ PASSED |

## US3 — Estimasi biaya pembelian

> Sebagai **pemilik UMKM**, saya ingin **menghitung total biaya pembelian termasuk ongkos kirim**
> agar **saya tahu anggaran yang dibutuhkan dan apakah pesanan memenuhi syarat supplier**.

| ID | Acceptance criteria | Status |
| -- | ------------------- | ------ |
| AC1 | Subtotal memakai harga setelah diskon; besar penghematan ditampilkan | ✅ PASSED |
| AC2 | Total = subtotal + ongkos kirim zona; tanpa zona (ambil sendiri) = tanpa ongkir | ✅ PASSED |
| AC3 | Jumlah di bawah minimum order produk → peringatan | ✅ PASSED |
| AC4 | Subtotal di bawah minimum belanja supplier → peringatan; tepat di batas lolos | ✅ PASSED |
| AC5 | Zona yang tidak dilayani dan stok habis ditandai | ✅ PASSED |
| AC6 | Jumlah kosong/0/negatif/pecahan tidak dihitung dan diberi pesan | ✅ PASSED |

## US4 — Mengirim permintaan penawaran (RFQ)

> Sebagai **pemilik UMKM**, saya ingin **mengirim permintaan penawaran harga ke supplier**
> agar **saya mendapat harga resmi dan permintaan saya tercatat**.

| ID | Acceptance criteria | Status |
| -- | ------------------- | ------ |
| AC1 | Data valid tersimpan (201), dapat nomor `RFQ-xxxxx`, estimasi dari harga setelah diskon | ✅ PASSED |
| AC2 | Field wajib & format nomor WhatsApp Indonesia divalidasi; pesan error per field | ✅ PASSED |
| AC3 | Jumlah di bawah minimum order produk ditolak | ✅ PASSED |
| AC4 | Produk yang tidak dijual supplier atau stoknya habis ditolak | ✅ PASSED |
| AC5 | Supplier tidak ada → 404; body bukan JSON → 400 | ✅ PASSED |
| AC6 | Daftar permintaan terbaru di atas dan bisa difilter per supplier | ✅ PASSED |

## US5 — Memantau & memperbarui status permintaan penawaran

> Sebagai **pemilik UMKM**, saya ingin **melihat balasan harga dari supplier lalu menerima, menolak, atau membatalkan
> permintaan** agar **proses pengadaan tercatat sampai selesai**.

Alur status: `BARU → DIBALAS → DITERIMA / DITOLAK`, dan `BARU / DIBALAS → DIBATALKAN`.
`DITERIMA`, `DITOLAK`, `DIBATALKAN` adalah status akhir.

| ID | Acceptance criteria | Status |
| -- | ------------------- | ------ |
| AC1 | Perpindahan status mengikuti alur di atas (mis. tidak bisa *Terima* sebelum dibalas) | ✅ PASSED |
| AC2 | Membalas wajib menyertakan harga penawaran bilangan bulat > 0; pesan maks. 500 karakter | ✅ PASSED |
| AC3 | Balasan tersimpan; total penawaran = harga penawaran × jumlah | ✅ PASSED |
| AC4 | Perpindahan terlarang → 409 dan status di database tidak berubah | ✅ PASSED |
| AC5 | Id tidak ada → 404; data tidak valid → 400; body bukan JSON → 400 | ✅ PASSED |
| AC6 | Daftar bisa difilter per status; status tidak dikenal → 400 | ✅ PASSED |

---

## Cakupan penyelesaian

| Cakupan | Bukti | Status |
| ------- | ----- | ------ |
| Seluruh fitur inti MVP selesai | 5 user story di atas | ✅ |
| UI + logika aplikasi + database/API terintegrasi | Halaman → `src/lib` (aturan bisnis) → `src/server` (service) → Prisma → SQLite; REST API di `src/app/api` | ✅ |
| Alur utama berjalan dari awal sampai akhir | `demo.mp4` (cari → bandingkan → estimasi → RFQ → balas → terima) dan uji `curl` ke build produksi | ✅ |
| Input tidak valid | Validasi server + pesan per field (US4, US5), parameter API 400, peringatan estimasi (US3) | ✅ |
| Data kosong | *Empty state* pencarian, perbandingan tanpa supplier, permintaan kosong / tidak cocok filter, supplier tanpa stok | ✅ |
| Loading | Skeleton di `/suppliers`, tombol "Mengirim…/Menyimpan…" saat submit | ✅ |
| Kegagalan | Pesan + tombol *Coba lagi* di `/suppliers`, `error.tsx` (gagal memuat halaman), `not-found.tsx` (404), pesan "Tidak dapat terhubung ke server" pada form, 409 bila status berubah bersamaan | ✅ |
| Uji fitur inti + regresi | `npm test` 30/30 (12 test lama tetap lulus setelah refactor), `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |

## Bug yang ditemukan & diperbaiki saat pengujian

| # | Gejala | Penyebab | Perbaikan |
| - | ------ | -------- | --------- |
| 1 | `/suppliers/x99` mengembalikan status 200 (bukan 404) setelah menambah `app/loading.tsx` | Halaman di-*stream*, status HTTP sudah terkirim sebelum `notFound()` dipanggil | `loading.tsx` global dihapus (halaman `/suppliers` sudah punya skeleton sendiri); diuji ulang → 404 |
| 2 | Aturan harga setelah diskon ditulis ulang di 4 tempat dengan pembulatan berbeda | Logika ada di dalam komponen | Satu fungsi `finalPrice` di `src/lib/pricing.ts`, diuji di `compare.test.ts` |
| 3 | Penawaran 150 kg dari PT Surya Bahan Industri lolos RFQ padahal di bawah minimum belanja Rp2.000.000 | Minimum belanja supplier belum pernah dicek | Estimasi biaya (US3) menampilkan peringatan minimum belanja sebelum RFQ dikirim |
