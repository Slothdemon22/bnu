import CaseStudiesSection from "@/components/landing/CaseStudiesSection";
import ContactSection from "@/components/landing/ContactSection";
import HeroSection from "@/components/landing/HeroSection";
import LandingCtaBand from "@/components/landing/LandingCtaBand";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import ProcessSection from "@/components/landing/ProcessSection";
import TestimonialSection from "@/components/landing/TestimonialSection";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("home");

export default function Home() {
  return (
    <main className="w-full bg-gradient-to-b from-background via-background to-muted/20">
      <HeroSection />

      <section className="border-y border-border/60 bg-background/70 backdrop-blur-sm">
        <LandingStatsStrip />
      </section>

      <div className="mx-auto max-w-7xl">
        <CaseStudiesSection />
      </div>

      <section className="mx-auto max-w-7xl py-6">
        <ProcessSection />
      </section>

      <section className="mx-auto max-w-7xl">
        <TestimonialSection />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 md:px-8">
        <LandingCtaBand />
      </section>

      <div className="mx-auto max-w-7xl">
        <ContactSection />
      </div>
    </main>
  );
}
