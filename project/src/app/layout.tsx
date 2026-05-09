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
  title: "Momentum - Gamified AI Productivity Platform",
  description: "Momentum combines AI task management, gamification, video meetings, and advanced analytics into a single sleek platform.",
  openGraph: {
    title: "Momentum - Gamified AI Productivity Platform",
    description: "Level up your productivity with AI-driven task management and gamified workspaces.",
    url: "https://momentum-app.vercel.app", // Adjust if real domain is known
    siteName: "Momentum",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Momentum Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Momentum - Gamified AI Productivity Platform",
    description: "Level up your productivity with AI-driven task management and gamified workspaces.",
    images: ["/og-image.png"],
  },
};

import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserOnboardingGuard } from "@/components/auth/UserOnboardingGuard";
import { AppLayout } from "@/components/custom/AppLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToasterProvider />
            <UserOnboardingGuard>
              <AppLayout>{children}</AppLayout>
            </UserOnboardingGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
