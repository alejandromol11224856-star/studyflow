import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Hoy" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tour?: string; action?: string }> }) {
  const { tour, action } = await searchParams;
  return <DashboardView startTour={tour === "1"} action={action === "timer" || action === "log" ? action : null} />;
}
