import type { Metadata } from "next";
import { ActivitiesView } from "@/components/activities/activities-view";

export const metadata: Metadata = { title: "Historial" };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  return <ActivitiesView initialSection={section} />;
}
