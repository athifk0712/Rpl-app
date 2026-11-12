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

const NETWORK_ERROR = "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";

// Kirim JSON ke API. Gagal jaringan (fetch melempar) dibedakan dari server yang membalas error/bukan JSON.
async function sendJson(url: string, method: "POST" | "PATCH", payload: unknown) {
  let res: Response;
  try {
    res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {
    return { network: true as const };
  }
  return { network: false as const, res, body: await readJson(res) };
}

export async function submitQuoteRequest(input: QuoteRequestInput): Promise<SubmitQuoteResult> {
  const result = await sendJson("/api/quote-requests", "POST", input);
  if (result.network) return { ok: false, error: NETWORK_ERROR, fields: {} };
  const { res, body } = result;
  if (res.ok && body) return { ok: true, quote: body as QuoteRequest };
  const err = (body ?? {}) as Partial<QuoteValidationError>;
  return { ok: false, error: err.error ?? serverErrorMessage(res.status), fields: err.fields ?? {} };
}

export async function changeQuoteStatus(
  id: number,
  update: QuoteStatusUpdate
): Promise<{ ok: true; quote: QuoteRequest } | { ok: false; error: string }> {
  const result = await sendJson(`/api/quote-requests/${id}`, "PATCH", update);
  if (result.network) return { ok: false, error: NETWORK_ERROR };
  const { res, body } = result;
  if (res.ok && body) return { ok: true, quote: body as QuoteRequest };
  return { ok: false, error: (body as ApiError | null)?.error ?? serverErrorMessage(res.status) };
}
