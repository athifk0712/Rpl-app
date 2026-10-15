# Cara Menjalankan SupplierHub

Aplikasi web full-stack (Next.js 16 + Prisma 7 + SQLite). UI dan REST API berjalan dalam satu proses.
**Tidak perlu Docker atau server database**: database berupa file `prisma/dev.db`.

## 1. Prasyarat

| Kebutuhan | Versi | Cek |
| --------- | ----- | --- |
| Node.js | 20 atau lebih baru (diuji dengan Node 24) | `node -v` |
| npm | bawaan Node.js | `npm -v` |
| Git | versi apa pun | `git --version` |

## 2. Instalasi (sekali saja)

```bash
git clone <url-repo> Rpl-app
cd Rpl-app
npm install                 # memasang dependensi + otomatis menjalankan `prisma generate`
```

Salin file konfigurasi database:

```bash
cp .env.example .env                  # macOS / Linux / Git Bash
Copy-Item .env.example .env           # Windows PowerShell
```

Isi `.env`: `DATABASE_URL="file:./prisma/dev.db"`

Buat database dari migrasi dan isi data contoh (8 kategori, 22 produk, 10 supplier):

```bash
npm run db:setup
```

## 3. Menjalankan aplikasi

### Mode pengembangan

```bash
npm run dev
```

Buka <http://localhost:3000>.

### Mode produksi

```bash
npm run build
npm start                   # http://localhost:3000
```

## 4. Menjalankan unit test

```bash
npm test
```

Hasil yang diharapkan:

```text
 Test Files  5 passed (5)
      Tests  30 passed (30)
```

Test memakai database terpisah `prisma/test.db` yang dibuat ulang setiap kali `npm test` dijalankan
(lihat `tests/global-setup.ts`), jadi data di `dev.db` tidak berubah. Daftar lengkap test ada di
[`docs/evidence/unit-test.txt`](docs/evidence/unit-test.txt) dan [`checklist_mvp.md`](checklist_mvp.md).

Pemeriksaan lain:

```bash
npm run lint                # ESLint
npx tsc --noEmit            # cek tipe TypeScript
```

## 5. Skenario demo (± 2 menit, sesuai `demo.mp4`)

1. **Beranda** → ketik `tepung` → Cari.
2. **US1 Cari:** di `/suppliers` buka **Filter** → Provinsi `Jawa Barat` → **Cari** (3 hasil menjadi 1).
   Ketik `xyz` → muncul *empty state*.
3. **US2 Bandingkan:** tekan ikon bandingkan pada 3 kartu (tombol supplier lain nonaktif karena sudah 3)
   → **Bandingkan sekarang** → tabel perbandingan dengan penanda "terbaik".
4. **US3 Estimasi:** buka **PT Surya Bahan Industri** (`/suppliers/s10`) → bagian *Estimasi Biaya Pembelian*:
   * Tepung Terigu Protein Tinggi, 50 kg → peringatan minimum order 100 kg.
   * 150 kg + zona Pulau Jawa → peringatan subtotal di bawah minimum belanja Rp2.000.000.
   * 200 kg → memenuhi syarat, total = subtotal + ongkir.
5. **US4 RFQ:** bagian *Minta Penawaran Harga*:
   * Kirim form kosong → pesan error merah per field.
   * Jumlah 50 → ditolak server (minimum order).
   * Jumlah 200, nama, WhatsApp `081234567890` → sukses, muncul nomor `RFQ-xxxxx`.
6. **US5 Status:** **Lihat semua permintaan** → status *Baru* → **Balas (supplier)** isi harga 9800 → status
   *Dibalas supplier* + total penawaran → **Terima** → status akhir *Diterima* (tombol aksi hilang).
   Filter **Status = Diterima** → **Terapkan**.
7. Buka `/suppliers/x99` → halaman 404.

Contoh uji API dengan `curl` (server harus berjalan):

```bash
curl "http://localhost:3000/api/suppliers?query=tepung&province=Jawa%20Barat"
curl -X POST http://localhost:3000/api/quote-requests -H "Content-Type: application/json" \
  -d '{"supplierId":"s10","productId":"p01","businessName":"Roti Bu Sari","contactName":"Sari","phone":"081234567890","quantity":200}'
curl -X PATCH http://localhost:3000/api/quote-requests/1 -H "Content-Type: application/json" \
  -d '{"status":"DIBALAS","offeredPrice":9800,"replyNote":"Siap kirim"}'
curl "http://localhost:3000/api/quote-requests?status=DIBALAS"
```

## 6. Perintah database

| Perintah | Fungsi |
| -------- | ------ |
| `npm run db:setup` | Terapkan semua migrasi + isi data contoh (instalasi baru) |
| `npm run db:seed` | **Reset** isi database ke data contoh (permintaan penawaran ikut terhapus) |
| `npm run db:migrate` | Buat migrasi baru setelah mengubah `prisma/schema.prisma` |
| `npx prisma studio` | Lihat/ubah isi database di browser |

## 7. Masalah umum

| Gejala | Penyebab | Solusi |
| ------ | -------- | ------ |
| `DATABASE_URL belum diatur` | File `.env` belum ada | Salin `.env.example` menjadi `.env` |
| Halaman "Terjadi kesalahan saat memuat halaman" / tabel tidak ditemukan | Database belum dibuat atau migrasi belum diterapkan | `npm run db:setup` |
| `POST`/`PATCH` → 500 setelah `git pull` | `npm run dev` masih memakai Prisma Client lama | `npx prisma generate`, lalu restart `npm run dev` |
| Port 3000 sudah dipakai | Ada aplikasi lain di port 3000 | `npm run dev -- -p 3001` |
| `npm install` gagal di `better-sqlite3` | Versi Node terlalu lama | Pasang Node.js 20+ |
