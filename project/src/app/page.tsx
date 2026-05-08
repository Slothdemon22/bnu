import CaseStudiesSection from "@/components/landing/CaseStudiesSection";
import ContactSection from "@/components/landing/ContactSection";
import HeroSection from "@/components/landing/HeroSection";
import ProcessSection from "@/components/landing/ProcessSection";
import TestimonialSection from "@/components/landing/TestimonialSection";
import Navbar from "@/components/custom/Navbar";
import Footer from "@/components/custom/Footer";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("home");

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main id="main-content" role="main" className="pt-20">
        <div className="mx-auto max-w-6xl">
          <HeroSection />
          <CaseStudiesSection />
          <ProcessSection />
          <TestimonialSection />
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
