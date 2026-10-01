import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES, PRODUCTS, SUPPLIERS } from "./seed-data";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });

async function main() {
  await prisma.$transaction([
    prisma.quoteRequest.deleteMany(),
    prisma.supplierProduct.deleteMany(),
    prisma.shippingOption.deleteMany(),
    prisma.shippingRate.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  for (const name of CATEGORIES) {
    await prisma.category.create({ data: { name } });
  }

  for (const { category, ...product } of PRODUCTS) {
    await prisma.product.create({ data: { ...product, category: { connect: { name: category } } } });
  }

  for (const { categories, shippingOptions, shippingCost, products, ...supplier } of SUPPLIERS) {
    await prisma.supplier.create({
      data: {
        ...supplier,
        categories: { connect: categories.map((name) => ({ name })) },
        shippingOptions: { create: shippingOptions.map((name) => ({ name })) },
        shippingRates: { create: Object.entries(shippingCost).map(([zone, cost]) => ({ zone, cost })) },
        products: { create: products },
      },
    });
  }

  console.log(`Seed selesai: ${CATEGORIES.length} kategori, ${PRODUCTS.length} produk, ${SUPPLIERS.length} supplier.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
