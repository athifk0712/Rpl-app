import type { Prisma } from "@/generated/prisma/client";
import type { Product, SortOption, Stock, Supplier, SupplierSearchParams } from "@/types";
import { prisma } from "./db";

const SUPPLIER_INCLUDE = {
  categories: { orderBy: { id: "asc" } },
  shippingOptions: { orderBy: { id: "asc" } },
  shippingRates: { orderBy: { id: "asc" } },
  products: { orderBy: { productId: "asc" }, include: { product: { include: { category: true } } } },
} satisfies Prisma.SupplierInclude;

type SupplierRow = Prisma.SupplierGetPayload<{ include: typeof SUPPLIER_INCLUDE }>;

const ORDER_BY: Record<SortOption, Prisma.SupplierOrderByWithRelationInput> = {
  rating: { rating: "desc" },
  review: { reviewCount: "desc" },
  price_asc: { minOrderValue: "asc" },
  price_desc: { minOrderValue: "desc" },
};

export const SORT_OPTIONS = Object.keys(ORDER_BY) as SortOption[];

function toSupplier(row: SupplierRow): Supplier {
  const { categories, shippingOptions, shippingRates, products, ...supplier } = row;
  return {
    ...supplier,
    categories: categories.map((c) => c.name),
    shippingOptions: shippingOptions.map((o) => o.name),
    shippingCost: Object.fromEntries(shippingRates.map((r) => [r.zone, r.cost])),
    products: products.map(({ product, discount, stock, ...offer }) => ({
      ...offer,
      stock: stock as Stock,
      ...(discount !== null && { discount }),
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit,
        description: product.description,
        category: product.category.name,
      },
    })),
  };
}

// Kata kunci dicocokkan ke nama supplier, nama produk, atau kategori produk.
// Postgres LIKE peka huruf besar/kecil, jadi pencarian memakai mode "insensitive" (ILIKE).
function buildWhere({ query, category, province, maxPrice }: SupplierSearchParams): Prisma.SupplierWhereInput {
  const q = query?.trim();
  return {
    AND: [
      category ? { categories: { some: { name: category } } } : {},
      province ? { province } : {},
      maxPrice ? { products: { some: { pricePerUnit: { lte: maxPrice } } } } : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { products: { some: { product: { name: { contains: q, mode: "insensitive" } } } } },
              { products: { some: { product: { category: { name: { contains: q, mode: "insensitive" } } } } } },
            ],
          }
        : {},
    ],
  };
}

export async function searchSuppliers(params: SupplierSearchParams = {}): Promise<Supplier[]> {
  const rows = await prisma.supplier.findMany({
    where: buildWhere(params),
    orderBy: [ORDER_BY[params.sort ?? "rating"], { id: "asc" }],
    include: SUPPLIER_INCLUDE,
  });
  return rows.map(toSupplier);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const row = await prisma.supplier.findUnique({ where: { id }, include: SUPPLIER_INCLUDE });
  return row ? toSupplier(row) : null;
}

export async function getSupplierIds(): Promise<string[]> {
  const rows = await prisma.supplier.findMany({ select: { id: true }, orderBy: { id: "asc" } });
  return rows.map((r) => r.id);
}

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { id: "asc" }, include: { category: true } });
  return rows.map((p) => ({ id: p.id, name: p.name, unit: p.unit, description: p.description, category: p.category.name }));
}
