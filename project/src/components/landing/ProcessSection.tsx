"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useRef } from "react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface processType {
  title: string;
  tagline: string;
  description: string;
  bg_image: string;
  deliverables: {
    item: string;
  }[];
}

const ProcessCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const process: processType[] = [
    {
      title: "Discovery & Strategy",
      tagline: "Getting to Know Your Big Idea",
      description:
        "We begin by diving deep into your vision, your goals, and the problem you’re solving. This stage is all about uncovering the story behind your idea and understanding why it matters. Through thorough market research and a detailed competitor analysis, we identify unique opportunities and define the best way to position your product for long-term success. This step ensures that your foundation is solid before any building begins.",
      deliverables: [
        { item: "Detailed market insights" },
        { item: "Comprehensive competitor breakdown" },
        { item: "A winning strategy tailored to your product" },
      ],
      bg_image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png",
    },
    {
      title: "Planning & Wireframes",
      tagline: "Mapping Out Your Vision",
      description:
        "Once we know where you want to go, we carefully map out how to get there. Our team creates structured wireframes and a detailed project scope so that everyone involved knows exactly what’s being built and how. This stage eliminates guesswork and brings clarity to the entire process. By the end, you’ll have a well-defined roadmap that aligns with your vision and keeps the project on track from start to finish.",
      deliverables: [
        { item: "Complete project blueprint" },
        { item: "High-fidelity wireframes" },
        { item: "Technical implementation plan" },
      ],
      bg_image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    },
    {
      title: "Design & Development",
      tagline: "Building Your Dream Into Reality",
      description:
        "This is where ideas start to take shape. Our designers and developers work hand in hand to turn your vision into a functional, scalable, and visually stunning platform. Every detail is thoughtfully crafted — from intuitive user experiences to reliable back-end systems. We combine creativity with technology to deliver a product that not only looks beautiful but also performs seamlessly and grows with your business.",
      deliverables: [
        { item: "A fully designed user-friendly platform" },
        { item: "Robust, scalable development" },
        { item: "End-to-end tested product ready for growth" },
      ],
      bg_image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804376/fasimage_skodum.png",
    },
    {
      title: "Launch & Growth",
      tagline: "Getting You Out There",
      description:
        "Bringing your platform to life is just the beginning of the journey. We provide full support for launch, making sure everything runs smoothly and your product reaches the right audience. Beyond launch day, we help you craft and refine marketing strategies, track performance, and implement optimizations that fuel sustainable growth. Our focus is on making sure your business doesn’t just go live, but thrives in the market.",
      deliverables: [
        { item: "Hands-on launch support" },
        { item: "Tailored marketing strategy" },
        { item: "Actionable tips and ongoing growth guidance" },
      ],
      bg_image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    },
  ];

  useGSAP(() => {
    const slides = slidesRef.current;
    if (!slides.length || !headingRef.current || !sectionRef.current) return;

    const headerPin = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 5%",
      endTrigger: slidesRef.current[slidesRef.current.length - 2],
      end: "center top",
      pin: headingRef.current,
      pinSpacing: false,
      anticipatePin: 1,
    });

    slides.slice(0, 3).forEach((slide) => {
      if (!slide) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: slide,
          start: "top 25%",
          end: "bottom top",
          scrub: 1,
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
        },
      });

      // Responsive animation values
      const getAnimationValues = () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        if (isMobile) {
          return {
            scale: 0.8,
            z: -50,
            rotationX: 8,
            opacity: 0,
          };
        } else if (isTablet) {
          return {
            scale: 0.7,
            z: -75,
            rotationX: 12,
            opacity: 0,
          };
        } else {
          return {
            scale: 0.6,
            z: -100,
            rotationX: 15,
            opacity: 0,
          };
        }
      };

      tl.to(slide, {
        ...getAnimationValues(),
        duration: 0.7,
        ease: "power2.inOut",
      });
    });

    // Add responsive behavior
    const updatePinning = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      if (isMobile) {
        // Disable header pinning on mobile for better UX
        headerPin.disable();
      } else if (isTablet) {
        // Reduce pinning intensity on tablet
        headerPin.enable();
      } else {
        // Full pinning on desktop
        headerPin.enable();
      }
    };

    if (headingRef.current) {
      gsap.effects.fadeUpOnScroll(headingRef.current, {
        start: "top 80%",
        duration: 0.8,
        markers: false,
      });
    }

    // Initial call
    updatePinning();

    // Update on window resize
    window.addEventListener("resize", updatePinning);

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      window.removeEventListener("resize", updatePinning);
    };
  }, []);

  const addSlideRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      slidesRef.current[index] = el;
    }
  };

  return (
    <div ref={sectionRef} className="relative space-y-4 px-4 sm:px-6 lg:px-8">
      <SectionHeading
        ref={headingRef}
        badge="Our Proven Process"
        heading="How We Bring Ideas to Life"
        description="Explore our latest projects featuring AI-powered platforms, business solutions, and innovative designs that have driven measurable growth for our clients."
        size="md"
        align="center"
        as="h2"
        id="process-heading"
        className="mb-6 md:mb-14"
      />

      <div ref={containerRef} className="relative">
        {process.map((slide, index) => (
          <div
            key={`slide-main-${index}`}
            ref={(el) => addSlideRef(el, index)}
            className="relative mb-6 flex h-fit w-full items-center justify-center sm:mb-8 md:mb-10"
          >
            <div
              className={`relative h-fit w-full rounded-lg bg-cover p-4 sm:p-6 md:p-8 lg:p-10`}
              style={{ backgroundImage: `url(${slide.bg_image})` }}
            >
              <div className="w-full space-y-3 rounded-md bg-white/20 p-4 backdrop-blur-lg sm:space-y-4 sm:p-6 md:max-w-7/12">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="heading text-h4 text-heading font-semibold">{slide.title}</h3>
                  <p className="text-xs font-normal tracking-wide text-[#323c4d] sm:text-sm">
                    <span> 💡</span> {slide.tagline}
                  </p>
                </div>

                <p className="text-p text-sm leading-snug text-black/60 sm:text-base lg:max-w-4/5">
                  {slide.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3 md:mt-8">
                  {slide.deliverables.map((dl, ix) => (
                    <li
                      key={`deliverable-${dl.item}-${ix}`}
                      className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4"
                    >
                      {dl.item}
                    </li>
                  ))}
                  <li className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4">
                    competitor breakdown
                  </li>
                  <li className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4">
                    {" "}
                    your winning strategy
                  </li>
                </ul>
              </div>
              <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-6 md:right-12 md:bottom-8 lg:right-16 lg:bottom-10">
                <div className={`relative`}>
                  <span
                    className={`text-6xl font-extrabold text-transparent sm:text-7xl md:text-8xl lg:text-9xl`}
                    style={{
                      WebkitTextStroke: "2px rgb(225,225,225,0.9",
                      textShadow: "0 1px 2px rgba(225, 225, 225, 0.05)",
                      color: "rgb(0,0,0,0.09)",
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessCards;
