"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Calendar,
  Terminal,
  Activity,
  Users,
  Wand2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  type DemoState = "idle" | "analyzing" | "planning" | "generating" | "complete";
  const timeoutsRef = useRef<number[]>([]);
  const presets = useMemo(
    () => [
      {
        id: "startup",
        label: "Founder Sprint",
        prompt:
          "Prepare investor update, finalize landing page copy, and schedule product review tomorrow at 10am.",
        summary: "2 meetings auto-scheduled · 3 tasks prioritized · 1 focus block generated",
        tasks: [
          { title: "Created Task: Investor Update Deck", icon: Terminal },
          { title: "Scheduled Product Review Meeting", icon: Calendar },
          { title: "Assigned Copy Review to Content Team", icon: Users },
          { title: "Generated 90-minute Focus Session", icon: Sparkles },
        ],
      },
      {
        id: "student",
        label: "Student Mode",
        prompt:
          "Finish DSA assignment by Friday, revise OS notes, and plan mock interview with mentor.",
        summary: "Revision slots balanced · deadlines sorted · mock prep auto-planned",
        tasks: [
          { title: "Created Task: DSA Assignment", icon: Terminal },
          { title: "Planned OS Revision Session", icon: Activity },
          { title: "Scheduled Mock Interview", icon: Calendar },
          { title: "Generated Exam Focus Timeline", icon: Sparkles },
        ],
      },
      {
        id: "team",
        label: "Team Ops",
        prompt:
          "Run weekly sprint review, assign QA checklist, and generate recurring standup tasks for next week.",
        summary: "Recurring workflow created · QA owners assigned · sprint sync ready",
        tasks: [
          { title: "Created Task: Sprint Review Agenda", icon: Terminal },
          { title: "Auto-assigned QA Checklist", icon: Users },
          { title: "Scheduled Weekly Sprint Review", icon: Calendar },
          { title: "Regenerated Recurring Standup Tasks", icon: Sparkles },
        ],
      },
    ],
    []
  );

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [demoInput, setDemoInput] = useState(presets[0].prompt);
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setDemoInput(presets[selectedPreset].prompt);
  }, [selectedPreset, presets]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const clearDemoTimers = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  const handleOptimizeClick = () => {
    if (demoState !== "idle") return;

    clearDemoTimers();
    setDemoState("analyzing");
    setProgress(28);

    const t1 = window.setTimeout(() => {
      setDemoState("planning");
      setProgress(58);
    }, 900);

    const t2 = window.setTimeout(() => {
      setDemoState("generating");
      setProgress(82);
    }, 1800);

    const t3 = window.setTimeout(() => {
      setDemoState("complete");
      setProgress(100);
    }, 3200);

    timeoutsRef.current = [t1, t2, t3];
  };

  const resetDemo = () => {
    clearDemoTimers();
    setDemoState("idle");
    setProgress(0);
  };
  const activePreset = presets[selectedPreset];

  return (
    <div className="relative min-h-[90vh] flex items-center w-full justify-center overflow-hidden bg-background py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 animate-pulse" style={{ backgroundColor: 'var(--accent-strong)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ backgroundColor: 'var(--accent-strong)' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6 lg:gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tag-bg border border-border w-fit">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-strong)' }} />
              <span className="text-sm font-medium text-tag">Momenta AI 2.0 Live</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-heading leading-[1.1]">
              Your Autonomous <br />
              <span style={{ color: 'var(--accent-strong)' }}>
                Productivity OS
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-label leading-relaxed max-w-xl">
              Plan less. Execute faster. Let AI optimize your workflow, manage tasks, and orchestrate your calendar automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 lg:pt-4">
              <Button 
                size="lg" 
                className="h-14 px-8 text-base rounded-xl font-medium transition-all hover:scale-105 active:scale-95 text-white"
                style={{ backgroundColor: 'var(--accent-strong)' }}
                asChild
              >
                <Link href="/signup">
                  Launch Workspace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-base border-border text-foreground hover:bg-muted rounded-xl font-medium transition-all"
                asChild
              >
                <Link href="#process-heading">
                  <Play className="mr-2 w-5 h-5" />
                  See How It Works
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-4 lg:pt-8 text-sm text-label">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-strong)' }} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-strong)' }} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-strong)' }} />
                <span>Realtime AI automation</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative w-full"
          >
            {/* Glow backing */}
            <div className="absolute -inset-1 rounded-2xl blur-xl opacity-30" style={{ backgroundColor: 'var(--accent-strong)' }} />
            
            <div className="relative w-full rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col min-h-[450px]" style={{ backgroundColor: 'var(--surface-muted)' }}>
              
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-label bg-tag-bg px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--accent-strong)' }} />
                  Momenta Assistant
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 relative">
                {/* Initial Input state */}
                <div className="relative">
                  <div className={`p-4 rounded-xl border transition-all duration-500 ${demoState !== "idle" ? "shadow-md" : "border-border"}`} style={{ backgroundColor: 'var(--surface)', borderColor: demoState !== "idle" ? 'var(--accent-strong)' : '' }}>
                    <textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      disabled={demoState !== "idle"}
                      rows={3}
                      className="w-full resize-none bg-transparent text-foreground pr-8 text-sm sm:text-base outline-none placeholder:text-muted-foreground disabled:opacity-80"
                      placeholder="Describe your day and let Momenta plan it..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map((preset, idx) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (demoState === "idle") setSelectedPreset(idx);
                      }}
                      disabled={demoState !== "idle"}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide transition-all ${
                        selectedPreset === idx
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      } disabled:opacity-60`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Processing States */}
                <AnimatePresence mode="wait">
                  {demoState === "analyzing" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 font-medium ml-2 text-sm sm:text-base"
                      style={{ color: 'var(--accent-strong)' }}
                    >
                      <div className="flex gap-1">
                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-strong)' }} />
                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-strong)' }} />
                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-strong)' }} />
                      </div>
                      Understanding your context...
                    </motion.div>
                  )}

                  {demoState === "planning" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 font-medium ml-2 text-sm sm:text-base"
                      style={{ color: "var(--accent-strong)" }}
                    >
                      <Wand2 className="h-4 w-4 animate-pulse" />
                      Building an optimal execution plan...
                    </motion.div>
                  )}

                  {(demoState === "generating" || demoState === "complete") && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-2 sm:gap-3"
                    >
                      {activePreset.tasks.map((task, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.3, type: "spring", stiffness: 200, damping: 20 }}
                          className={`flex items-center gap-3 sm:gap-4 p-3 rounded-lg border border-border shadow-sm`}
                          style={{ backgroundColor: 'var(--surface)' }}
                        >
                          <div className={`p-2 rounded-md bg-tag-bg`}>
                            <task.icon className={`w-4 h-4 text-foreground`} />
                          </div>
                          <span className="text-foreground text-xs sm:text-sm font-medium">{task.title}</span>
                          {demoState === "complete" && (
                            <motion.div 
                              initial={{ scale: 0 }} 
                              animate={{ scale: 1 }} 
                              className="ml-auto"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Final Summary & Schedule Preview */}
                <AnimatePresence>
                  {demoState === "complete" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="mt-2 p-4 rounded-xl border relative overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--accent-strong)' }}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Calendar className="w-20 h-20 sm:w-24 sm:h-24" />
                      </div>
                      
                      <div className="flex gap-2 mb-3 sm:mb-4">
                        <div className="h-4 sm:h-6 w-12 sm:w-16 rounded border opacity-50" style={{ backgroundColor: 'var(--accent-strong)' }} />
                        <div className="h-4 sm:h-6 w-16 sm:w-24 bg-muted rounded border border-border" />
                        <div className="h-4 sm:h-6 w-8 sm:w-12 bg-tag-bg rounded border border-border" />
                      </div>
                      
                      <p className="font-medium relative z-10 flex items-start sm:items-center gap-2 text-xs sm:text-sm text-foreground">
                        <Sparkles className="w-4 h-4 mt-0.5 sm:mt-0 shrink-0" style={{ color: 'var(--accent-strong)' }} />
                        {activePreset.summary}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Action Area */}
              <div className="p-4 border-t border-border relative z-20" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: "var(--accent-strong)" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
                <Button 
                  onClick={demoState === "complete" ? resetDemo : handleOptimizeClick}
                  disabled={demoState !== "idle" && demoState !== "complete"}
                  className={`w-full h-12 text-md font-medium transition-all duration-300 rounded-xl
                    ${demoState === "idle" 
                      ? "text-white shadow-lg hover:shadow-xl hover:opacity-90" 
                      : "bg-muted text-muted-foreground border border-border"}`}
                  style={demoState === "idle" ? { backgroundColor: 'var(--accent-strong)' } : demoState === "complete" ? { backgroundColor: 'var(--surface)' } : {}}
                >
                  {demoState === "idle" ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Run Live Demo
                    </span>
                  ) : demoState === "analyzing" || demoState === "planning" || demoState === "generating" ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                      Working in real-time...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: 'var(--accent-strong)' }}>
                      <RotateCcw className="w-5 h-5" />
                      Replay Scenario
                    </span>
                  )}
                </Button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
