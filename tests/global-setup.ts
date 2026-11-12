import "dotenv/config";
import { execSync } from "node:child_process";

// Database khusus test: schema "test" (TEST_DATABASE_URL) dimigrasi lalu diisi ulang dari seed setiap kali test dijalankan.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL belum diatur. Lihat .env.example.");
  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
  execSync("npx prisma migrate deploy", { env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}
