import { NextResponse, type NextRequest } from "next/server";
import { createQuoteRequest, listQuoteRequests } from "@/server/quote-service";
import type { ApiError, QuoteRequest, QuoteValidationError } from "@/types";

export async function GET(request: NextRequest) {
  const supplierId = request.nextUrl.searchParams.get("supplierId") ?? undefined;
  const quotes = await listQuoteRequests(supplierId);
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
