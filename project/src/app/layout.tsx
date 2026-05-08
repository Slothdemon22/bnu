import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import "@/lib/GSAPAnimations";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstatePro - Find Your Dream Home | Premium Real Estate",
  description: "Discover premium properties and expert real estate services. Buy, sell, or rent with EstatePro - your trusted partner in real estate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
