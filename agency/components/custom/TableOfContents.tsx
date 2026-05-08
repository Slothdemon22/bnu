"use client";

import "@/lib/GSAPAnimations";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useEffect, useRef, useState } from "react";
interface TableOfContentsProps {
  content: string;
  className?: string;
}

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Extract headings from HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    const headings: TOCItem[] = [];
    const headingElements = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");

    headingElements.forEach((element) => {
      const level = Number.parseInt(element.tagName.charAt(1));
      const title = element.textContent?.trim() || "";

      // Generate ID if not present
      let id = element.id;
      if (!id) {
        id = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
        element.id = id;
      }

      headings.push({ id, title, level });
    });

    setToc(headings);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = toc.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      const scrollPosition = window.scrollY + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const { id, element } = headings[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Animate the container
    gsap.effects.fadeUpOnScroll(containerRef.current, {
      start: "top 80%",
      duration: 0.8,
      markers: false,
    });

    // Animate title
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.2,
          ease: "power2.out",
        }
      );
    }

    // Animate navigation items with stagger
    if (navRef.current) {
      const navItems = navRef.current.querySelectorAll("button");
      gsap.fromTo(
        navItems,
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.4,
          ease: "power2.out",
        }
      );
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [toc]);

  if (toc.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      <h3 ref={titleRef} className="text-sm font-semibold text-text-heading mb-4">
        Table of Contents
      </h3>
      <nav
        ref={navRef}
        className="space-y-1 max-h-96 overflow-y-auto lg:max-h-none lg:overflow-visible"
      >
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={cn(
              "block w-full text-left text-xs sm:text-sm transition-all duration-200 hover:text-primary rounded-lg hover:font-medium hover:cursor-pointer py-1.5 px-2 hover:bg-muted/50",
              {
                "text-primary-foreground font-medium bg-primary rounded-lg cursor-pointer hover:bg-primary/90 hover:text-primary-foreground":
                  activeId === item.id,
                "text-label": activeId !== item.id,
                "pl-0": item.level === 1,
                "pl-2 sm:pl-3": item.level === 2,
                "pl-4 sm:pl-6": item.level === 3,
                "pl-6 sm:pl-9": item.level === 4,
                "pl-8 sm:pl-12": item.level === 5,
                "pl-10 sm:pl-15": item.level === 6,
              }
            )}
          >
            <span className="line-clamp-2">{item.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
