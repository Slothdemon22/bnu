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
  title: "FlowSync - AI-Powered Task Manager for Teams",
  description: "FlowSync combines AI task management, video meetings, real-time chat, and analytics into one seamless platform built for high-performance teams.",
};

import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserOnboardingGuard } from "@/components/auth/UserOnboardingGuard";
import { AppLayout } from "@/components/custom/AppLayout";

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
        <AuthProvider>
          <ToasterProvider />
          <UserOnboardingGuard>
            <AppLayout>{children}</AppLayout>
          </UserOnboardingGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
