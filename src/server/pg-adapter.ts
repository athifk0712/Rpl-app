import { PrismaPg } from "@prisma/adapter-pg";

// Adapter Postgres untuk Prisma. Parameter `?schema=` di URL (dipakai database test) diteruskan ke adapter,
// karena driver `pg` sendiri tidak mengenal parameter itu.
export function createPgAdapter(url: string) {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get("schema") ?? undefined;
  parsed.searchParams.delete("schema");
  return new PrismaPg({ connectionString: parsed.toString(), max: 5 }, schema ? { schema } : undefined);
}
