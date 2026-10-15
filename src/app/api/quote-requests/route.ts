import { NextResponse, type NextRequest } from "next/server";
import { isQuoteStatus, QUOTE_STATUSES } from "@/lib/quote-status";
import { createQuoteRequest, listQuoteRequests } from "@/server/quote-service";
import type { ApiError, QuoteRequest, QuoteValidationError } from "@/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supplierId = params.get("supplierId") || undefined;
  const status = params.get("status") || undefined;
  if (status !== undefined && !isQuoteStatus(status)) {
    return NextResponse.json<ApiError>(
      { error: `Parameter status tidak valid. Gunakan salah satu: ${QUOTE_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }
  const quotes = await listQuoteRequests({ supplierId, status });
  return NextResponse.json<{ total: number; quotes: QuoteRequest[] }>({ total: quotes.length, quotes });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  const result = await createQuoteRequest(body);
  if (!result.ok) {
    return NextResponse.json<QuoteValidationError>({ error: result.error, fields: result.fields }, { status: result.status });
  }
  return NextResponse.json<QuoteRequest>(result.quote, { status: 201 });
}
