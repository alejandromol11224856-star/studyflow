import type { Metadata } from "next";
import { MethodsView } from "@/components/methods/methods-view";

export const metadata: Metadata = { title: "Métodos" };

export default async function MethodsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <MethodsView initialKind={tab === "habits" ? "habit" : "study"} />;
}
