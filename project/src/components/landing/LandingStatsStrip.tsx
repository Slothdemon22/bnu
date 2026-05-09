"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Users, Zap } from "lucide-react";

const stats = [
  { icon: Brain, label: "AI-assisted tasks", value: "10k+" },
  { icon: Users, label: "Active teams", value: "1.2k+" },
  { icon: Zap, label: "Avg workflow speedup", value: "42%" },
  { icon: Sparkles, label: "Weekly automations", value: "25k+" },
];

export default function LandingStatsStrip() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:px-6 md:grid-cols-4 md:gap-4 md:py-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-2 inline-flex rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
            <stat.icon className="h-4 w-4" />
          </div>
          <p className="text-xl font-extrabold text-foreground md:text-2xl">{stat.value}</p>
          <p className="text-xs font-medium text-muted-foreground md:text-sm">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
