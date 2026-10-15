import { NextResponse, type NextRequest } from "next/server";
import { getQuoteRequest, updateQuoteStatus } from "@/server/quote-service";
import type { ApiError, QuoteRequest } from "@/types";

const NOT_FOUND = "Permintaan penawaran tidak ditemukan.";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/quote-requests/[id]">) {
  const quote = await getQuoteRequest(Number((await ctx.params).id));
  if (!quote) return NextResponse.json<ApiError>({ error: NOT_FOUND }, { status: 404 });
  return NextResponse.json<QuoteRequest>(quote);
}

// Body: { status, offeredPrice?, replyNote? }. offeredPrice wajib saat status menjadi DIBALAS.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/quote-requests/[id]">) {
  const id = Number((await ctx.params).id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  const result = await updateQuoteStatus(id, body);
  if (!result.ok) {
    return NextResponse.json<ApiError & { field?: string }>({ error: result.error, field: result.field }, { status: result.status });
  }
  return NextResponse.json<QuoteRequest>(result.quote);
}
