import { NextResponse, type NextRequest } from "next/server";
import { searchSuppliers, SORT_OPTIONS } from "@/server/supplier-service";
import type { ApiError, SortOption, SupplierListResponse } from "@/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort") ?? "rating";
  const maxPriceRaw = params.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  if (!SORT_OPTIONS.includes(sort as SortOption)) {
    return NextResponse.json<ApiError>(
      { error: `Parameter sort tidak valid. Gunakan salah satu: ${SORT_OPTIONS.join(", ")}.` },
      { status: 400 }
    );
  }
  if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    return NextResponse.json<ApiError>({ error: "Parameter maxPrice harus berupa angka 0 atau lebih." }, { status: 400 });
  }

  const suppliers = await searchSuppliers({
    query: params.get("query") ?? undefined,
    category: params.get("category") ?? undefined,
    province: params.get("province") ?? undefined,
    maxPrice,
    sort: sort as SortOption,
  });

  return NextResponse.json<SupplierListResponse>({ total: suppliers.length, suppliers });
}
