import type { Metadata } from "next";
import { GoalsView } from "@/components/goals/goals-view";

export const metadata: Metadata = { title: "Objetivos" };

export default function GoalsPage() {
  return <GoalsView />;
}
