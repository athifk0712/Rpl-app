export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function getStockBadgeClass(stock: string): string {
  switch (stock) {
    case "tersedia": return "bg-green-100 text-green-700";
    case "terbatas": return "bg-yellow-100 text-yellow-700";
    case "habis": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getStockLabel(stock: string): string {
  switch (stock) {
    case "tersedia": return "Stok Tersedia";
    case "terbatas": return "Stok Terbatas";
    case "habis": return "Stok Habis";
    default: return stock;
  }
}

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Tahun berjalan di zona waktu Indonesia (WIB), dipakai untuk teks copyright.
export function currentYear(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Jakarta" }).format(now));
}
