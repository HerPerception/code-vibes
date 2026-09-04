---
name: Midnight Obsidian Financial Discipline
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff516a'
  on-tertiary-container: '#5b0017'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  currency-stat:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
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
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  container-max: 80rem
---

## Brand & Style

This design system expresses disciplined financial mastery, sovereign control, and calculated calm. Designed for high-performing individuals managing complex multi-account liquidities, debt amortization waterfalls, and net-worth tracking, the interface acts as a personal financial command center.

The aesthetic fuses **Precision Minimalism** with **Atmospheric Dark Glassmorphism**:
- **Controlled Depth:** Midnight and obsidian substrates absorb visual noise, providing high-contrast clarity for dense numerical data.
- **Architectural Restraint:** Data readability supersedes ornamentation. Vibrancy is strictly functional: emerald signals solvency and asset inflow; rose indicates liabilities, debt drag, and outflow; electric cyan and royal indigo steer system interaction.
- **High-Fidelity Feedback:** Subtle luminescence, 1px frosted boundaries, and precise tabular micro-geometry invoke the prestige of high-end algorithmic terminals while maintaining modern consumer elegance.

## Colors

The palette employs deep obsidian-midnight foundations accented by purposeful, highly saturated state indicators.

### Base Surface Architecture
- **Canvas Base (`#0B0F19`):** Deepest obsidian background, providing total contrast for typography and floating modules.
- **Surface Elevation 1 (`#111827`):** Midnight card and panel container background.
- **Surface Elevation 2 (`#1F2937`):** Elevated modals, dropdown panels, and hovered table states.
- **Subtle Surface Glass (`rgba(17, 24, 39, 0.72)`): Frosted containers combined with backdrop filtering.

### Accent & Action Values
- **Primary Electric (`#3B82F6`):** Primary actions, focal buttons, active tab indicators, and progress indicators.
- **Primary Indigo Glow (`#6366F1`):** Secondary interactive triggers, multi-series chart strokes, and focus ring accents.
- **Inflow / Asset Emerald (`#10B981`, secondary `#059669`):** Credits, positive cash flows, asset accumulation, debt paydown confirmation.
- **Outflow / Debt Rose (`#F43F5E`, secondary `#E11D48`):** Unsecured liabilities, debt balances, urgent payment markers, negative variance.

### Line & Border Architecture
- **Muted Structural Border (`#374151`):** Structural table dividing lines and solid separators.
- **Luminescent Border Edge (`rgba(255, 255, 255, 0.08)`): Perimeter highlights on glass cards and floating cards.
- **Focus Ring Border (`rgba(59, 130, 246, 0.45)`): Accessible, glowing active state indicator.

## Typography

The type system blends the geometric authority of **Plus Jakarta Sans** for macro statements with the structural discipline of **Inter** for data tables and micro-metrics.

### Numerical Fidelity & Tabular Formatting
- All currencies, balance counts, APRs, amortization days, and percentage Deltas must explicitly declare `font-variant-numeric: tabular-nums lining-nums`. This prevents horizontal jitter during asynchronous live data recalculations.
- Numerical signs (+/-) must match their context color: emerald for positive changes or asset increases, rose for negative balance changes or interest fees.

### Hierarchy Guidelines
- **Metric Emphasis:** Primary account balances and debt snowballs use `currency-stat` or `headline-lg` with tightened tracking.
- **Contextual Micro-Labels:** `label-caps` in uppercase tracking (`letterSpacing: 0.06em`) format metadata labels (e.g., "PRINCIPAL REMAINING", "VARIABLE APR", "NEXT CYCLE DATE").
- **Secondary Context:** Metadata descriptions and supporting copy utilize `body-md` or `body-sm` rendered in muted slate (`#9CA3AF`).

## Layout & Spacing

The layout is built on an **8-point base spatial grid**, engineered around a structured 12-column responsive layout capped at `80rem` (1280px) for density preservation on ultra-wide viewports.

### Breakpoint Matrix
- **Mobile (< 768px):** 4 columns, `1rem` outer screen padding, single-column stacked debt cards, micro-charts constrained to 100% card width. Bottom fixed navigation handles primary balance navigation.
- **Tablet (768px - 1023px):** 8 columns, `1.5rem` gutters, 2-column KPI metric grids, horizontally scrollable multi-account tables.
- **Desktop (1024px+):** 12 columns, `1.5rem` gutters, persistent collapsible sidebar navigation (260px fixed), multi-pane layout balancing global balances against granular debt amortization ledgers.

### Density & Rhythms
- **Compact Data Rows:** Table row heights adhere to strict `40px` (dense) and `48px` (default) specifications with vertical cell alignments centered.
- **Dashboard Grids:** Metric overview cards sit in 3 or 4-column balanced rows with consistent `space-lg` gap distribution.

## Elevation & Depth

Visual hierarchy uses **tonal layer stacking** combined with **subtle frosted glass** rather than heavy drop shadows.

### Surface Elevation System
- **Layer 0 (Canvas):** Pure `#0B0F19`. Absolute baseline.
- **Layer 1 (Cards & Data Blocks):** `#111827` mixed with `backdrop-filter: blur(16px)` and bounded by a razor-thin border of `1px solid rgba(255, 255, 255, 0.08)`.
- **Layer 2 (Hovered Elements & Popovers):** `#1F2937` with an ambient glow shadow: `0 8px 32px -4px rgba(0, 0, 0, 0.5)`.
- **Layer 3 (Modal Sheets & Alert Drawers):** `#1F2937` bounded with `1px solid rgba(255, 255, 255, 0.12)`, lifted by `0 20px 48px -8px rgba(0, 0, 0, 0.7)`.

### Luminescent Accents
- Focus states and key callout badges employ a radial specular glow behind the boundary: `box-shadow: 0 0 20px -3px rgba(59, 130, 246, 0.25)`.
- Critical debt payoff milestones utilize an emerald highlight flare: `0 0 16px -2px rgba(16, 185, 129, 0.2)`.

## Shapes

The interface implements a refined **Level 2 (Rounded)** shape strategy. Precision financial products require crisp geometric boundaries with soft corners that preserve high information density without looking harsh.

### Corner Radius Mapping
- **Base Components (`0.5rem` / 8px):** Form input controls, buttons, table cell selections, micro-charts, and status tags.
- **Containers & Glass Cards (`1rem` / 16px):** Metric panels, debt payoff cards, account summary containers, and data visualization viewports.
- **High-Level Modals (`1.5rem` / 24px):** Dialog windows, major drawer sheets, and payoff celebration overlays.
- **Pills (`9999px`):** Status indicator tags, debt-type chips (e.g., "Revolving", "Installment"), and currency filter pills.

## Components

### Buttons
- **Primary:** Background `#3B82F6` transitioning to `#2563EB` on hover. White label with weight 600. Subtle glow: `box-shadow: 0 0 12px rgba(59, 130, 246, 0.35)`. Height `40px`, horizontal padding `1.25rem`.
- **Secondary (Neutral Glass):** Background `rgba(31, 41, 55, 0.6)`, border `1px solid rgba(255, 255, 255, 0.08)`. Color `#F9FAFB`. Hover background `rgba(55, 65, 81, 0.8)`.
- **Destructive / Paydown Action:** Background `rgba(244, 63, 94, 0.12)`, border `1px solid rgba(244, 63, 94, 0.3)`, text `#F43F5E`. Hover background `rgba(244, 63, 94, 0.2)`.

### Financial Metric & Glass Cards
- Background `#111827` at `0.8` opacity, filtered with `backdrop-filter: blur(12px)`.
- Edge highlight: `1px solid rgba(255, 255, 255, 0.08)`.
- Internal padding: `1.5rem`.
- Contains top row metadata label (`label-caps`, color `#9CA3AF`), central currency display (`currency-stat`), and bottom status change badge with micro sparkline.

### Status Chips & Pills
- Compact height (`24px`), fully rounded (`9999px`), padding `0.25rem 0.75rem`.
- **Inflow / Active / Paid:** Background `rgba(16, 185, 129, 0.12)`, text `#10B981`, border `1px solid rgba(16, 185, 129, 0.25)`.
- **Debt / Critical / Overdue:** Background `rgba(244, 63, 94, 0.12)`, text `#F43F5E`, border `1px solid rgba(244, 63, 94, 0.25)`.
- **Neutral Tracking:** Background `rgba(55, 65, 81, 0.5)`, text `#D1D5DB`, border `1px solid rgba(255, 255, 255, 0.05)`.

### Form Inputs & Selectors
- Container height `42px`. Background `#0B0F19`. Border `1px solid #374151`. Text `#F9FAFB`. Placeholder `#6B7280`.
- Focus state: Border `#3B82F6` accompanied by `0 0 0 3px rgba(59, 130, 246, 0.2)`.
- Currency prefix (`$`, `€`, `£`) anchored at `14px` inside input with muted color `#6B7280`.

### Data Tables & Ledgers
- Outer frame uses `1px solid #374151` with `rounded-lg` clipping.
- Headers: Background `#111827`, height `36px`, uppercase `label-caps` in `#9CA3AF`.
- Rows: Alternating zebra striping avoided in favor of sleek border separators (`1px solid rgba(55, 65, 81, 0.4)`).
- Hover state: Row background tints to `rgba(31, 41, 55, 0.5)`. All numerical values strictly right-aligned with `tabular-nums`.

### Micro-Charts & Progress Visualizers
- **Debt Snowball Progress Bars:** Height `6px`, background `#1F2937`, rounded pill cap. Filled with a gradient from `#3B82F6` to `#10B981` tracking principal paid.
- **Sparklines:** Linear SVG stroke (`2px`), transparent gradient fill underneath running to `rgba(16, 185, 129, 0)`.