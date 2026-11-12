import type {
  ApiError,
  QuoteFieldErrors,
  QuoteRequest,
  QuoteRequestInput,
  QuoteStatusUpdate,
  QuoteValidationError,
  SupplierListResponse,
  SupplierSearchParams,
} from "@/types";

// Body JSON dari respons, atau null jika server membalas bukan JSON (mis. halaman error HTML dari platform).
export async function readJson(res: Response): Promise<unknown> {
  if (!res.headers.get("content-type")?.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function serverErrorMessage(status: number): string {
  return `Server sedang bermasalah (kode ${status}). Coba lagi beberapa saat.`;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const body = await readJson(res);
  if (!res.ok || body === null) throw new Error((body as ApiError | null)?.error ?? serverErrorMessage(res.status));
  return body as T;
}

export function fetchSuppliers(params: SupplierSearchParams, signal?: AbortSignal) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, String(value));
  }
  return getJson<SupplierListResponse>(`/api/suppliers?${search}`, signal);
}

export type SubmitQuoteResult =
  | { ok: true; quote: QuoteRequest }
  | { ok: false; error: string; fields: QuoteFieldErrors };

export async function submitQuoteRequest(input: QuoteRequestInput): Promise<SubmitQuoteResult> {
  try {
    const res = await fetch("/api/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await res.json();
    if (res.ok) return { ok: true, quote: body as QuoteRequest };
    const err = body as Partial<QuoteValidationError>;
    return { ok: false, error: err.error ?? "Gagal mengirim permintaan.", fields: err.fields ?? {} };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.", fields: {} };
  }
}

export async function changeQuoteStatus(
  id: number,
  update: QuoteStatusUpdate
): Promise<{ ok: true; quote: QuoteRequest } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/quote-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const body = await res.json();
    if (res.ok) return { ok: true, quote: body as QuoteRequest };
    return { ok: false, error: (body as ApiError).error ?? "Gagal mengubah status permintaan." };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi." };
  }
}
