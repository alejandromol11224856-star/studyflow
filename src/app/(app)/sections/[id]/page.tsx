import type { Metadata } from "next";
import { SectionDetailView } from "@/components/sections/section-detail-view";

export const metadata: Metadata = { title: "Sección" };

export default async function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SectionDetailView id={id} />;
}
