import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("blog");

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
