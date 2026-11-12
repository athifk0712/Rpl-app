// Ringkasan hasil Vitest (reporter json) dalam Markdown untuk GitHub Actions Step Summary.
import { existsSync, readFileSync } from "node:fs";

const file = process.argv[2] ?? "test-results.json";
if (!existsSync(file)) {
  console.log("## Unit test\n\n❌ Hasil test tidak ditemukan (test gagal sebelum selesai).");
  process.exit(0);
}
const r = JSON.parse(readFileSync(file, "utf8"));
const ok = r.numFailedTests === 0 && r.success;
const lines = [
  `## Unit test ${ok ? "✅ semua lulus" : "❌ ada yang gagal"}`,
  "",
  "| Total | Lulus | Gagal | Dilewati |",
  "|---:|---:|---:|---:|",
  `| ${r.numTotalTests} | ${r.numPassedTests} | ${r.numFailedTests} | ${r.numPendingTests + (r.numTodoTests ?? 0)} |`,
  "",
  "| File | Lulus | Gagal |",
  "|---|---:|---:|",
];
for (const f of r.testResults) {
  const name = f.name.replaceAll("\\", "/").split("/tests/").pop();
  const passed = f.assertionResults.filter((a) => a.status === "passed").length;
  const failed = f.assertionResults.filter((a) => a.status === "failed").length;
  lines.push(`| ${name} | ${passed} | ${failed} |`);
}
const failures = r.testResults.flatMap((f) => f.assertionResults.filter((a) => a.status === "failed"));
if (failures.length) {
  lines.push("", "### Test yang gagal", "");
  for (const a of failures) lines.push(`- ${a.fullName}`);
}
console.log(lines.join("\n"));
