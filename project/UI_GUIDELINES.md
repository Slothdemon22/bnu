# FlowSync — UI / IO Design Guidelines

> Derived from the landing-page theme (`/src/components/custom/Navbar.tsx` + `Footer.tsx`) and the landing-page section components (`/src/components/landing/`).  
> **All new pages and components MUST conform to this document.**

---

## 1. Brand Identity

| Token | Value |
|-------|-------|
| **Product name** | FlowSync |
| **Tagline** | AI-Powered Task Management for Efficient Teams |
| **Logo** | Ionio horizontal logo (`https://cdn.prod.website-files.com/…horizontal-logo-transperant.png`) |
| **Primary accent** | `rgb(29, 39, 54)` — deep navy-slate |
| **Personality** | Premium · Minimal · Smart · Team-focused |

---

## 2. Colour System

### CSS Variables (`:root` — light mode)
```css
--background:       oklch(0.9816 0.0017 247.839);   /* near-white cool grey */
--foreground:       oklch(0.3695 0.0381 260.5);      /* dark blue-grey text */
--primary:          rgb(29, 39, 54);                  /* deep navy */
--primary-hover:    rgb(72, 82, 97);
--primary-foreground: #ffffff;
--muted:            oklch(0.9674 0.0013 286.375);
--muted-foreground: oklch(0.5517 0.0138 285.938);
--border:           oklch(0.9197 0.004 286.320);
--accent:           oklch(0.9674 0.0013 286.375);
--text-heading:     rgb(50, 60, 77);
--text-label:       rgb(102, 110, 125);
--text-tag:         rgb(102, 110, 125);
--text-tag-bg:      rgb(239, 241, 246);
```

### Dark Mode Overrides (`.dark`)
```css
--background:  oklch(0.1408 0.0044 285.82);
--foreground:  oklch(0.9851 0 0);
--surface:     #151c25;
--surface-muted: #1b2430;
--accent-strong: #3ab4a9;  /* teal highlight in dark mode */
```

### Usage Rules
- **Headings** → `text-heading` (`--text-heading`)
- **Body / labels** → `text-label` (`--text-label`)
- **Badges / tags** → `bg-tag-bg text-tag`
- **CTA buttons** → `bg-primary text-primary-foreground hover:bg-primary-hover`
- **Borders** → `border-border`
- **Never** use raw Tailwind colors (e.g., `bg-blue-500`) — always use CSS variables.

---

## 3. Typography

### Font Stack
| Role | Font | CSS variable |
|------|------|-------------|
| Primary UI | **Inter Tight** | `--font-Inter` |
| Mono / code | Geist Mono | `--font-geist-mono` |
| Marketing headings | Manrope | `--font-manrope` |
| Technical labels | IBM Plex Mono | `--font-ibm-plex-mono` |

```css
body { font-family: "Inter Tight", sans-serif; }
```

### Type Scale (utility classes from `globals.css`)
| Class | Size |
|-------|------|
| `.text-h1` | `text-3xl md:text-5xl font-bold` |
| `.text-h2` | `text-2xl md:text-4xl font-semibold` |
| `.text-h3` | `text-xl md:text-3xl font-semibold` |
| `.text-h4` | `text-lg md:text-2xl font-medium` |
| `.text-h5` | `text-base md:text-xl font-medium` |
| `.text-h6` | `text-sm md:text-lg font-medium` |
| `.text-caption` | `text-xs md:text-sm` |

### Rules
- **H1** → only once per page; use `as="h1"` in `<SectionHeading>`.
- **Heading color** → always `text-heading` (never raw `text-gray-*`).
- **Body text** → `text-label` or `text-foreground/70`.
- **Line height** → `leading-tight` for headings, `leading-snug` for descriptions.

---

## 4. Layout & Spacing

### Container
```html
<!-- Full-bleed section wrapper -->
<div class="content-wrap">…</div>

<!-- Page shell (used in login / signup) -->
<div class="page-shell min-h-screen">…</div>
```

`content-wrap` = `max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8`

### Section Anatomy
Every marketing section follows this pattern:
```
<section class="px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12 lg:py-24">
  <SectionHeading badge="…" heading="…" size="md" align="center" as="h2" />
  {/* content grid */}
</section>
```

### Spacing Scale
- **Within card**: `p-4 sm:p-6 md:p-8`
- **Between sections**: `py-12 md:py-20 lg:py-24`
- **Gap between cards**: `gap-4 sm:gap-6 md:gap-8`
- **Stack spacing**: `space-y-4 sm:space-y-6`

---

## 5. Components

### 5.1 `<SectionHeading>` — `@/components/custom/SectionHeading.tsx`
The canonical heading block for every section.

```tsx
<SectionHeading
  badge="Badge label"
  heading="Main section title"
  description="Optional supporting text shown to screen readers."
  icon={LucideIcon}    // optional
  size="md"            // sm | md | lg | xl
  align="center"       // left | center | right
  as="h2"              // HTML heading level
  id="section-id"
  showDescriptionToScreenReaders={true}
/>
```

**Do not** write raw `<h2>` + badge `<span>` combinations — always use this component.

### 5.2 `<Navbar>` — `@/components/custom/Navbar.tsx`
- Fixed, floating pill at `top-2` with `max-w-6xl` centering.
- Hides on scroll-down, reappears on scroll-up (GSAP `ScrollTrigger`).
- Contains: logo · nav links · GitHub icon · "Work with us" CTA.
- **This navbar MUST appear in every page** — it is NOT rendered by `layout.tsx` (which intentionally has no nav/footer); each page wraps its own content.

> ⚠️ **Nav links for FlowSync:**
> `Home /` · `Tasks /tasks` · `Meetings /meeting` · `Chat /chat` · `Profile /profile`
> Replace "Work with us" CTA with **"Get Started"** → `/signup`.

### 5.3 `<Footer>` — `@/components/custom/Footer.tsx`
- Dark gradient footer (`bg-[linear-gradient(…black…)]`) with marquee brand text.
- Contains: company info · resource links · social links · "Work with us" CTA.
- **This footer MUST appear in every page.**

> ⚠️ **Footer links for FlowSync:**
> Resources: `Features`, `Pricing`, `Docs`
> Connect: Twitter, LinkedIn, GitHub
> Marquee characters: `F`, `L`, `O`, `W`, `S`, `Y`, `N`, `C`

### 5.4 Buttons
```tsx
// Primary CTA
<Button size="sm">Get Started</Button>

// Secondary / outline
<Button variant="outline">Learn More</Button>

// Ghost / dark surface
<Button variant="outline" className="border-primary-foreground/5 bg-white/5 text-white hover:bg-white/10">
  Action <ArrowUpRight className="ml-2 h-4 w-4" />
</Button>
```

### 5.5 Cards
```tsx
<div class="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* content */}
</div>
```

### 5.6 Badges / Tags
```tsx
<span class="bg-tag-bg text-tag rounded-3xl px-4 py-1 text-xs font-medium">
  Label
</span>
```

### 5.7 `<Marquee>` — `@/components/magicui/marquee`
Used in Hero (integration logos) and Footer (brand text). Props: `pauseOnHover`, `className="[--duration:Xs]"`.

### 5.8 `<InteractiveGridPattern>` — `@/components/magicui/interactive-grid-pattern`
Used as a decorative background overlay on dark panel sections.

---

## 6. Animation System (GSAP)

All animations use GSAP + ScrollTrigger via custom effects registered in `@/lib/GSAPAnimations.ts`.

### Registered Effects
| Effect | Usage |
|--------|-------|
| `gsap.effects.fadeUpOnScroll(el, opts)` | Fade-up reveal on scroll entry |
| `gsap.effects.staggerFadeUpOnScroll(el, opts)` | Staggered children fade-up |

### Standard Options
```ts
gsap.effects.fadeUpOnScroll(ref.current, {
  start: "top 80%",
  duration: 0.8,
  markers: false,     // always false in production
})
```

### Rules
- Import GSAP effects via `import "@/lib/GSAPAnimations"` before using custom effects.
- Register plugins inside the component: `gsap.registerPlugin(ScrollTrigger, useGSAP)`.
- Always **clean up** in the return of `useGSAP`:
  ```ts
  return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  ```
- Navbar uses GSAP for hide-on-scroll — do not interfere with `navRef`.

---

## 7. Page-Level Conventions

### 7.1 Every App Page Shell
```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main id="main-content" role="main" className="pt-20">
        {/* page content */}
      </main>
      <Footer />
    </div>
  )
}
```
- `pt-20` accounts for the fixed Navbar height (~80px).
- `id="main-content"` is required for the skip-link in Navbar.

### 7.2 Auth Pages (Login / Signup)
- Do **not** show Navbar/Footer — they are standalone screens.
- Use `page-shell` + `content-wrap` classes from `globals.css`.
- Update copy from "EstatePro" → "FlowSync".

### 7.3 Dashboard / App Pages
- **DO** render `<Navbar />` + `<Footer />`.
- Replace all `<HomeNav>` / `<HomeFooter>` imports with `<Navbar>` / `<Footer>` from `@/components/custom`.

---

## 8. FlowSync — Feature Pages Map

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Marketing landing — AI task manager pitch | Needs rebrand |
| `/tasks` | AI-powered task board | New |
| `/meeting` | Online video meetings (100ms) | Exists |
| `/chat` | Team community chat | Exists |
| `/profile` | User profile & notifications | Exists |
| `/login` | Auth — sign in | Exists (needs rebrand) |
| `/signup` | Auth — create account | Exists (needs rebrand) |
| `/admin` | Admin dashboard | Exists |

---

## 9. Landing Page → FlowSync Transformation

### Hero Section
- Badge: `"AI-Powered Teams"`
- Heading: `"The Smartest Way to Manage Work Together"`
- CTAs: `"Start for Free"` (primary) + `"Watch Demo"` (outline)
- Replace client logo marquee with **integration logos**

### Feature Sections
1. **AI Task Intelligence** — Smart auto-assignment, priority prediction, deadline alerts
2. **Online Meetings** — Built-in video calls via 100ms, no external tools
3. **Team Chat** — Real-time threaded messaging
4. **Analytics Dashboard** — Burndown charts, velocity tracking
5. **Workflow Automation** — Rule-based triggers, recurring tasks

### Stats
- `500+` Teams · `10M+` Tasks Completed · `99.9%` Uptime

---

## 10. Accessibility Rules

- Every page has a single `<h1>`.
- All interactive elements have `aria-label` or visible label.
- Images have descriptive `alt` text; decorative images use `aria-hidden="true"`.
- Skip link in Navbar targets `#main-content`.
- Color contrast ≥ 4.5:1 for normal text (WCAG AA).

---

## 11. File / Folder Conventions

```
src/
  app/
    layout.tsx          ← NO nav/footer here (intentional)
    page.tsx            ← Landing (Navbar + Footer inline)
    tasks/page.tsx      ← New tasks board
    meeting/…           ← Meetings
    chat/page.tsx       ← Chat
    profile/page.tsx    ← Profile
    login/page.tsx      ← No Navbar/Footer
    signup/page.tsx     ← No Navbar/Footer
    admin/…             ← Admin
  components/
    custom/
      Navbar.tsx        ← THE canonical navbar
      Footer.tsx        ← THE canonical footer
      SectionHeading.tsx
    landing/            ← Landing section components
    ui/                 ← shadcn/ui primitives
  lib/
    GSAPAnimations.ts   ← Custom GSAP effect registry
    metadata.ts         ← Page metadata generator
```

**Never** import `HomeNav` or `HomeFooter` from `@/components/home/` — those are deprecated.
**Always** use `@/components/custom/Navbar` and `@/components/custom/Footer`.

---

*Last updated: 2026-05-08 | Version 1.0*
