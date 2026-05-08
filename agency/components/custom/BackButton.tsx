"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/blog";
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="flex items-center gap-2 text-white/80 backdrop-blur-sm hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Blog
    </Button>
  );
}
