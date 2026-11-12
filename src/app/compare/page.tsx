import type { Metadata } from "next";
import { connection } from "next/server";
import { searchSuppliers } from "@/server/supplier-service";
import CompareClient from "./CompareClient";

export const metadata: Metadata = { title: "Bandingkan Supplier" };

export default async function ComparePage() {
  await connection();
  const suppliers = await searchSuppliers();
  return <CompareClient suppliers={suppliers} />;
}
