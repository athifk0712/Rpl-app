import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Database khusus test: dibuat ulang dari migrasi + seed setiap kali test dijalankan.
export default function setup() {
  const env = { ...process.env, DATABASE_URL: "file:./prisma/test.db" };
  rmSync("prisma/test.db", { force: true });
  execSync("npx prisma migrate deploy", { env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}
