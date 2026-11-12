// Batas atas angka pada RFQ. Kolom database bertipe INTEGER (maks 2.147.483.647), jadi nilai di atas batas
// ini ditolak dengan pesan validasi, bukan dibiarkan menjadi error 500 di database.
export const MAX_QUANTITY = 1_000_000;
export const MAX_UNIT_PRICE = 1_000_000_000;
