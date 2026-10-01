import { connection } from "next/server";
import { searchSuppliers } from "@/server/supplier-service";
import CompareClient from "./CompareClient";

export default async function ComparePage() {
  await connection();
  const suppliers = await searchSuppliers();
  return <CompareClient suppliers={suppliers} />;
}
