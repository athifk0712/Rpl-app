import type { Metadata } from "next";
import { siteUrl } from "./site";

const DESCRIPTION = "Temukan, bandingkan, dan hubungi supplier bahan baku terpercaya untuk UMKM Indonesia.";

// Metadata dasar seluruh halaman. metadataBase membuat URL Open Graph absolut,
// sehingga preview link di WhatsApp/media sosial tampil.
export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "SupplierHub — Platform Supplier UMKM Indonesia", template: "%s · SupplierHub" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SupplierHub",
    title: "SupplierHub — Platform Supplier UMKM Indonesia",
    description: DESCRIPTION,
    url: "/",
  },
};
