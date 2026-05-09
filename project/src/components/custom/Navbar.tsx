"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [workspace, setWorkspace] = useState<{ name: string; imageUrl: string | null } | null>(null);

  useEffect(() => {
    const parts = pathname.split('/');
    if (parts[1] === 'workspaces' && parts[2]) {
      fetch(`/api/workspaces/${parts[2]}`)
        .then(res => res.json())
        .then(data => {
          if (data.workspace) setWorkspace(data.workspace);
        })
        .catch(() => setWorkspace(null));
    } else {
      setWorkspace(null);
    }
  }, [pathname]);

  const navLinks = [
    {
      name: "Home",
      href: "/",
      description: "Return to homepage",
    },
    ...(user ? [
      {
        name: "Workspaces",
        href: "/workspaces",
        description: "Switch between your team workspaces",
      },
      {
        name: "Profile",
        href: "/profile",
        description: "Manage your account and notifications",
      },
    ] : []),
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveIndex(-1);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveIndex(-1);
    // Return focus to menu button when closing
    buttonRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % navLinks.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + navLinks.length) % navLinks.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(navLinks.length - 1);
        break;
      case "Escape":
        closeMenu();
        break;
    }
  };

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector("a") as HTMLAnchorElement;
      if (firstLink) {
        firstLink.focus();
      }
    }
  }, [isMenuOpen]);

  useGSAP(() => {
    const headerEl = navRef.current;
    if (!headerEl) return;

    let isHidden = false;
    let headerHeight = headerEl.offsetHeight;
    gsap.set(headerEl, { y: 0, willChange: "transform" });

    const onResize = () => {
      headerHeight = headerEl.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const st = ScrollTrigger.create({
      start: "top top",
      end: "max",
      onUpdate: (self) => {
        const scrolled = self.scroll();
        // Keep visible when menu is open
        if (isMenuOpen) {
          if (isHidden) {
            isHidden = false;
          }
          gsap.to(headerEl, { y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
          return;
        }

        // Always show at the very top
        if (scrolled <= 0) {
          if (isHidden) {
            isHidden = false;
          }
          gsap.to(headerEl, { y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
          return;
        }

        if (self.direction === 1) {
          // Scrolling down → hide
          if (!isHidden) {
            isHidden = true;
            gsap.to(headerEl, {
              y: -headerHeight,
              duration: 0.45,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        } else if (self.direction === -1) {
          // Scrolling up → show
          if (isHidden) {
            isHidden = false;
            gsap.to(headerEl, { y: 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
          }
        }
      },
    });

    return () => {
      st.kill();
      window.removeEventListener("resize", onResize);
      gsap.set(headerEl, { y: 0 });
    };
  }, []);

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring !sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>

      <header
        ref={navRef}
        className="bg-background fixed inset-x-0 top-2 z-40 mx-auto w-full max-w-6xl rounded-lg px-5"
        role="banner"
        aria-label="Main navigation"
      >
        <div className="container mx-auto">
          <nav
            className="flex items-center justify-between py-4"
            role="navigation"
            aria-label="Primary navigation"
          >
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="focus:ring-ring flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Momentum - Return to homepage"
                aria-describedby="logo-description"
              >
                {workspace?.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200 dark:border-gray-800 shadow-sm">
                      <img src={workspace.imageUrl} alt={workspace.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase text-stone-900 dark:text-white">
                      {workspace.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="Momentum Logo"
                      className="h-10 w-10 rounded-lg shadow-sm"
                      width="40"
                      height="40"
                      aria-hidden="true"
                    />
                    <span className="font-black text-xl tracking-tighter text-stone-900 dark:text-white">
                      Momentum
                    </span>
                  </div>
                )}
                <span id="logo-description" className="sr-only">
                  {workspace ? `${workspace.name} - ${workspace.imageUrl ? 'Custom Workspace' : 'Momentum'}` : 'Momentum - AI-Powered Task Management for Teams'}
                </span>
              </Link>
            </div>

            <ul
              className="hidden items-center space-x-6 lg:flex"
              role="menubar"
              aria-label="Main navigation menu"
            >
              {navLinks.map((link, index) => {
                const isActive =
                  pathname === link.href || (link.href.startsWith("/#") && pathname === "/");

                return (
                  <li key={link.name} role="none">
                    <Link
                      href={link.href}
                      className={`text-text-heading hover:text-foreground focus:ring-ring rounded-md px-2 py-1 !text-sm font-medium transition-colors focus:ring-0 focus:outline-none ${
                        isActive ? "text-foreground font-normal" : "text-foreground/70"
                      }`}
                      role="menuitem"
                      aria-describedby={`nav-description-${index}`}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(-1)}
                    >
                      {link.name}
                      <span id={`nav-description-${index}`} className="sr-only">
                        {link.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-3">
              {user ? (
                <Button
                  size={"sm"}
                  variant="outline"
                  className="text-sm border-stone-200 dark:border-gray-700 hidden sm:inline-flex"
                  onClick={logout}
                >
                  Logout
                </Button>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white px-2">
                    Login
                  </Link>
                  <Button
                    size={"sm"}
                    className="text-sm"
                    aria-label="Get started with Momentum"
                    onClick={() => window.location.href = '/signup'}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-md outline-none focus:ring-0 focus:outline-none"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-haspopup="true"
              >
                <span
                  aria-hidden="true"
                  className={`bg-foreground absolute left-1/2 block h-0.5 w-6 -translate-x-1/2 rounded-sm transition-all duration-200 ease-in-out ${
                    isMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-3 rotate-0"
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`bg-foreground absolute left-1/2 block h-0.5 w-6 -translate-x-1/2 rounded-sm transition-all duration-200 ease-in-out ${
                    isMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-5 rotate-0"
                  }`}
                />
                <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
              </button>
            </div>
          </nav>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div
              className="lg:hidden"
              ref={menuRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="">
                <div className="space-y-2 px-2 py-4">
                  <ul className="space-y-2" role="menu" aria-label="Mobile navigation options">
                    {navLinks.map((link, index) => {
                      const isActive =
                        pathname === link.href || (link.href.startsWith("/#") && pathname === "/");

                      return (
                        <li key={link.name} role="none">
                          <Link
                            href={link.href}
                            className={`hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors focus:outline-none ${
                              activeIndex === index || isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/70"
                            }`}
                            role="menuitem"
                            tabIndex={activeIndex === index ? 0 : -1}
                            aria-describedby={`mobile-nav-description-${index}`}
                            onClick={closeMenu}
                            onKeyDown={(e) => handleKeyDown(e)}
                          >
                            {link.name}
                            <span id={`mobile-nav-description-${index}`} className="sr-only">
                              {link.description}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-stone-200 dark:border-gray-800 pt-4 space-y-3">
                    {user ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => { closeMenu(); logout(); }}
                      >
                        Logout
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => { closeMenu(); window.location.href = '/login'; }}
                        >
                          Login
                        </Button>
                        <Button
                          className="w-full"
                          aria-label="Get started with Momentum"
                          onClick={() => { closeMenu(); window.location.href = '/signup'; }}
                        >
                          Get Started
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default Navbar;
