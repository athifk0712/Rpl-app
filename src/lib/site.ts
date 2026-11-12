// URL publik aplikasi untuk sitemap, robots.txt, dan metadata.
// Urutan: NEXT_PUBLIC_SITE_URL (diatur manual) → domain production Vercel (otomatis) → localhost saat development.
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
