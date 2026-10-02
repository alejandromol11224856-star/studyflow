import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MethodDetail } from "@/components/methods/methods-view";
import { METHODS, methodBySlug } from "@/lib/methods";

// Solo existen los métodos de lib/methods.ts: cualquier otro slug es un 404 real.
export const dynamicParams = false;

export function generateStaticParams() {
  return METHODS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const method = methodBySlug((await params).slug);
  return { title: method ? method.name : "Método" };
}

export default async function MethodPage({ params }: { params: Promise<{ slug: string }> }) {
  const method = methodBySlug((await params).slug);
  if (!method) notFound();
  return <MethodDetail method={method} />;
}
