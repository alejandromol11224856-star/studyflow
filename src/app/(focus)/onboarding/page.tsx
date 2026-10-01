import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Configuración inicial" };

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
