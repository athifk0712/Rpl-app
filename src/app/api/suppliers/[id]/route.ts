import { NextResponse, type NextRequest } from "next/server";
import { getSupplierById } from "@/server/supplier-service";
import type { ApiError, Supplier } from "@/types";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/suppliers/[id]">) {
  const { id } = await ctx.params;
  const supplier = await getSupplierById(id);

  if (!supplier) {
    return NextResponse.json<ApiError>({ error: `Supplier dengan id "${id}" tidak ditemukan.` }, { status: 404 });
  }
  return NextResponse.json<Supplier>(supplier);
}
