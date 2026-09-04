---
name: Clarity Wealth
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777b'
  outline-variant: '#c4c6cb'
  surface-tint: '#575f68'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141c24'
  on-primary-container: '#7d858e'
  inverse-primary: '#bfc7d1'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#40000c'
  on-tertiary-container: '#f83256'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe3ed'
  primary-fixed-dim: '#bfc7d1'
  on-primary-fixed: '#141c24'
  on-primary-fixed-variant: '#404850'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  currency-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  margin-screen: 1.25rem
  gutter-mobile: 0.75rem
---

## Brand & Style

This design system delivers an approachable, reassuring, and exceptionally legible financial environment tailored for daily money tracking and personal wealth cultivation. Personal finance often triggers cognitive fatigue and stress; this aesthetic combats that anxiety with an open, uncluttered, and breathable modern minimalism that emphasizes confidence, order, and control.

### Aesthetic Foundation
- **Modern Soft Minimalism:** A calm, clean architecture built on warm off-whites, neutral boundary lines, and expansive whitespace.
- **Tone & Mood:** Trustworthy, uplifting, calm, and deliberate. The interface behaves like an intuitive financial advisor—supportive rather than demanding.
- **Visual Weight:** Surfaces are lightweight and airy. High-contrast financial indicators immediately separate inflows from outflows, reducing visual scanning time to a minimum.

## Colors

The color palette prioritizes quick semantic parsing of financial transactions while maintaining a grounded, non-clinical environment.

- **Primary Canvas & Neutrals:**
  - Base Background (`#F8FAFC`): A soft, luminous off-white creating a gentle backdrop without harsh glare.
  - Surface Neutral (`#FFFFFF`): Pure white surfaces that float seamlessly over the background to frame transaction modules and metric cards.
  - Surface Subdued (`#F1F5F9`): Soft neutral gray for inactive buttons, card dividers, and recessed progress track backgrounds.
  - Primary Text & Ink (`#0D151C`): A deep slate-black providing crisp, accessible contrast for high-priority numbers, account names, and primary CTAs.
  - Secondary Slate (`#64748B`): Neutral mid-tone for auxiliary labels, timestamps, transaction categories, and currency qualifiers.

- **Financial Semantics:**
  - Inflow & Growth (`#059669` / Secondary): A vibrant emerald green dedicated strictly to income, credit additions, growth vectors, positive net cash flow, and successful goal milestones.
  - Outflow & Liabilities (`#E11D48` / Tertiary): A warm crimson/coral red assigned strictly to expenditures, outgoing transfers, subscriptions, debt metrics, and alert overages.
  - Semantic Rule: Emerald and crimson must never be used purely decoratively. Their sole purpose is to communicate direction of capital and fiscal status.

## Typography

Plus Jakarta Sans is utilized across all levels. Its balanced geometric construction and subtle organic warmth prevent financial interfaces from appearing clinical or intimidating.

- **Numerical Hierarchy:** All monetary values must enable tabular figures (`tnum`) in CSS/design settings to guarantee decimal alignment during rapid balance updates.
- **Currency Labels:** Use `currency-stat` for medium transaction callouts and `display-hero-mobile` for main balance summaries. The currency symbol (e.g., `$`, `€`, `£`) should be rendered slightly lighter or baseline-aligned without breaking visual momentum.
- **Scannability:** Micro-copy, category tags, and account identifiers strictly utilize `label-sm` with slight uppercase tracking to provide crisp contrast beneath large numerical readings.

## Layout & Spacing

The layout operates on a flexible 4px/8px incremental rhythm engineered specifically for high touch-ergonomics on single-hand mobile operations.

- **Layout Grid Model:**
  - Mobile (< 640px): Single-column continuous flow bordered by `margin-screen` (20px) side margins.
  - Tablet (640px – 1024px): 6-column fluid structure with 24px gutters, max card row grouping of 2 columns.
  - Desktop (> 1024px): Centered dashboard shell max-width of 1140px, 12-column grid with 32px margins.

- **Touch Zones & Breathing Room:**
  - Primary interactive components must observe a minimum hit box of 48px × 48px.
  - Card modules maintain 16px to 20px of internal padding (`space-md` to `space-lg`), ensuring numbers never feel crowded against module boundaries.
  - Section blocks are separated by `space-2xl` (32px) to clearly isolate balance summaries from recent activity streams and categorical budgets.

## Elevation & Depth

Visual hierarchy is maintained without heavy or muddy drop shadows. Depth is achieved via crisp surface layering, subtle boundary lines, and ultra-diffused atmospheric ambient glows.

- **Low-Contrast Perimeter (Ghost Borders):**
  - Cards and floating elements pair soft white backgrounds with a delicate 1px boundary stroke: `rgba(15, 23, 42, 0.06)`. This defines edges against the `#F8FAFC` canvas without creating rigid boxed visual weight.
- **Ambient Shadow System:**
  - **Resting Cards:** `0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)`
  - **Interactive Floating Elements (Modals, Action Sheets, Floating Buttons):** `0 12px 32px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)`
- **Depth Transitions:**
  - On active press, cards reduce scale slightly to `0.99` with shadow collapse, simulating a physical, responsive tap.

## Shapes

A roundedness scale of `2` provides friendly, approachable ergonomics that feel natural to touch gestures while retaining enough architectural discipline to preserve structural clarity.

- **Standard Elements (Input fields, standard buttons, badge containers):** 8px (`0.5rem`).
- **Cards, Sheets & Module Wrappers:** 16px (`1rem` / `rounded-lg`).
- **Action Trays & Modals:** 24px (`1.5rem` / `rounded-xl`) on top edges.
- **Pills & Status Indicators:** Fully rounded (`rounded-full` / 9999px) for quick transaction category tags and financial flow chips.

## Components

### Buttons
- **Primary Action:** Solid `#0D151C` with pure white text, 52px height for mobile reachability, `rounded-lg` (16px), semibold 15px label.
- **Secondary Action:** `#FFFFFF` background, 1px border `rgba(15, 23, 42, 0.1)`, dark slate text, subtle press state shifting to `#F1F5F9`.
- **Financial Flow CTA Buttons:** Small accent buttons for "Add Income" or "Send Money" using tinted backgrounds (e.g., `#059669` at 10% opacity with solid `#059669` text and icon).

### Cards & Metrics
- **Balance Card:** Clean pure white base, 16px corner radius, ghost border. Houses the main account balance in `display-hero-mobile`, accompanied by inline delta indicators (`+3.4% this month`) wrapped in an emerald tinted pill.
- **Spending / Outflow Cards:** Outlines the remaining budget using a soft horizontal track (`#F1F5F9`) filled with `#E11D48` if over budget or `#059669` if within normal limits.

### Transaction Lists
- **Item Row:** 64px default height with zero hard borders between list items. Uses clean vertical separation and generous padding.
- **Leading Icon Circle:** 44px round container filled with soft gray (`#F1F5F9`) holding a crisp monochrome category glyph (e.g., groceries, utility, salary).
- **Amount Label:** Right-aligned; positive inflows display `+$XX.XX` in emerald (`#059669`), negative outflows display `-$XX.XX` in ink primary (`#0D151C`) or warm crimson (`#E11D48`) when overdue or flagged.

### Input Fields
- **Monetary Amount Input:** 64px tall, large centered or left-anchored `headline-lg` numeric display, minimal border that turns into a crisp `#0D151C` 1.5px highlight on focus. Includes integrated currency symbol affix.
- **Form Text Fields:** 48px height, `#F8FAFC` interior, 1px border `rgba(15, 23, 42, 0.08)`, smooth shift to white on focus.

### Chips & Filter Tabs
- **Category Filter Pills:** 36px height, `rounded-full`, padding 12px horizontal. Inactive state utilizes `#F1F5F9` background with `#64748B` text. Active state transitions to `#0D151C` background with `#FFFFFF` text.

### Checkboxes & Segmented Controls
- **Segmented Control (e.g., Weekly / Monthly / Yearly):** 40px height enclosed pill container in `#F1F5F9`, active segment slides with a pure white elevated pill (`rounded-full`, 1px shadow).
- **Checkboxes & Toggles:** 22px square checkboxes with 6px roundedness; toggles use a smooth 28px pill track with 24px white circular thumb.