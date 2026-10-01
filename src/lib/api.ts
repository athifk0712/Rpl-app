import type { ApiError, SupplierListResponse, SupplierSearchParams } from "@/types";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const body = await res.json();
  if (!res.ok) throw new Error((body as ApiError).error ?? "Terjadi kesalahan saat memuat data.");
  return body as T;
}

export function fetchSuppliers(params: SupplierSearchParams, signal?: AbortSignal) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, String(value));
  }
  return getJson<SupplierListResponse>(`/api/suppliers?${search}`, signal);
}
