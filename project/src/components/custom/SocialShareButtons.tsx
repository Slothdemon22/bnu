"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

interface SocialShareButtonsProps {
  title: string;
  url?: string;
}

export function SocialShareButtons({ title, url }: SocialShareButtonsProps) {
  const handleGitHubShare = () => {
    // You can implement GitHub sharing logic here
    console.log("Share on GitHub:", title);
  };

  const handleExternalShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url: url || window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url || window.location.href);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 pt-8">
      <Button
        size="icon"
        variant="outline"
        onClick={handleGitHubShare}
        className="group size-12 border-0 bg-white/20 font-extrabold text-white backdrop-blur-2xl transition-all duration-150 ease-in-out hover:cursor-pointer"
        aria-label="Share on GitHub"
      >
        <Github className="h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 group-hover:cursor-pointer group-hover:font-bold group-hover:text-black" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={handleExternalShare}
        className="group size-12 border-0 bg-white/20 font-extrabold text-white backdrop-blur-2xl transition-all duration-150 ease-in-out hover:cursor-pointer"
        aria-label="Share article"
      >
        <ExternalLink className="h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 group-hover:cursor-pointer group-hover:font-bold group-hover:text-black" />
      </Button>
    </div>
  );
}
