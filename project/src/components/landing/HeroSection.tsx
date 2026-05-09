"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Play, CheckCircle2, Calendar, Loader2, Terminal, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const [demoState, setDemoState] = useState<"idle" | "typing" | "analyzing" | "generating" | "complete">("idle");

  const handleOptimizeClick = () => {
    if (demoState !== "idle") return;
    
    setDemoState("analyzing");
    
    // Simulate AI pipeline
    setTimeout(() => {
      setDemoState("generating");
      
      setTimeout(() => {
        setDemoState("complete");
      }, 2500);
    }, 1500);
  };

  const resetDemo = () => {
    setDemoState("idle");
  };

  const tasks = [
    { title: "Created Task: DSA Assignment", icon: Terminal },
    { title: "Scheduled Investor Meeting", icon: Calendar },
    { title: "Assigned High Priority", icon: Activity },
    { title: "Generated Focus Session", icon: Sparkles }
  ];

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
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-4 lg:pt-8 text-sm text-label">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-strong)' }} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-strong)' }} />
                <span>14-day free trial</span>
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
                    <p className="text-foreground pr-8 text-sm sm:text-base">
                      Finish DSA assignment by Friday and prepare for investor meeting tomorrow
                      {demoState === "idle" && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-[2px] h-4 ml-1 align-middle" style={{ backgroundColor: 'var(--accent-strong)' }} />}
                    </p>
                  </div>
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
                      Analyzing workflow...
                    </motion.div>
                  )}

                  {(demoState === "generating" || demoState === "complete") && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-2 sm:gap-3"
                    >
                      {tasks.map((task, i) => (
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
                        Your schedule has been optimized for maximum productivity.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Reset button - hidden overlay to restart demo easily */}
                {demoState === "complete" && (
                  <button 
                    onClick={resetDemo}
                    className="absolute inset-0 z-50 cursor-default"
                    aria-label="Reset demo"
                  />
                )}
              </div>

              {/* Bottom Action Area */}
              <div className="p-4 border-t border-border relative z-20" style={{ backgroundColor: 'var(--surface)' }}>
                <Button 
                  onClick={handleOptimizeClick}
                  disabled={demoState !== "idle"}
                  className={`w-full h-12 text-md font-medium transition-all duration-300 rounded-xl
                    ${demoState === "idle" 
                      ? "text-white shadow-lg hover:shadow-xl hover:opacity-90" 
                      : "bg-muted text-muted-foreground border border-border"}`}
                  style={demoState === "idle" ? { backgroundColor: 'var(--accent-strong)' } : {}}
                >
                  {demoState === "idle" ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Optimize My Day
                    </span>
                  ) : demoState === "analyzing" || demoState === "generating" ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                      Working...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: 'var(--accent-strong)' }}>
                      <CheckCircle2 className="w-5 h-5" />
                      Optimized
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
