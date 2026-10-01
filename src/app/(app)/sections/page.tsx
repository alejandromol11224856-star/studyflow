import type { Metadata } from "next";
import { SectionsView } from "@/components/sections/sections-view";

export const metadata: Metadata = { title: "Secciones" };

export default function SectionsPage() {
  return <SectionsView />;
}
