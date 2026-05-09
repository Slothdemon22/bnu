"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingCtaBand() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent p-6 md:p-8">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            <CalendarCheck2 className="h-4 w-4" />
            Built For Modern Teams
          </p>
          <h3 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Turn every plan into momentum.
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Create goals, automate repetitive work, and coordinate meetings from one AI-powered workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700">
            <Link href="/signup">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
