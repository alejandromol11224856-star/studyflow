import type { Metadata } from "next";
import { CheckEmailView } from "@/components/auth/email-flow";

export const metadata: Metadata = { title: "Revisá tu correo", robots: { index: false, follow: false } };

export default function CheckEmailPage() {
  return <CheckEmailView />;
}
