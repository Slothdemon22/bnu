import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("about");

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
