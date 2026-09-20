# Setu, Design Guide

Implementation spec for the design system. No rationale, no marketing copy. Just tokens, patterns, and constraints.

First-pass palette. Nothing here is locked; swap it if it doesn't feel right once the UI is actually on screen.

## Color tokens

CSS variables in `src/app/globals.css` (Tailwind v4, tokens auto-promote to utilities):

```css
@theme {
  --color-bg: #0b0d12;
  --color-surface: #12151c;
  --color-surface-elevated: #1a1e28;
  --color-border: #232838;

  --color-text: #f4f5f7;
  --color-text-muted: #9ca1ae;
  --color-text-faint: #5a5f6c;

  --color-accent: #5b7cfa;
  --color-accent-hover: #4763d6;
  --color-accent-faint: #5b7cfa1a;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #38bdf8;
}
```

## Typography

**Families** (loaded via `@fontsource` in `src/app/layout.tsx`):
- Display: Syne, for h1, h2, hero text
- Body: Onest, default for everything else
- Mono: JetBrains Mono, code, slugs, timestamps

**Weights used:**
- Body: 400, 500 for emphasis, 600 for buttons
- Display: 600, 700 for hero
- Mono: 400, 500

**Size scale** (rem):
| Token | Size | Use |
|---|---|---|
| text-xs | 0.75rem | Captions, badges |
| text-sm | 0.875rem | Secondary text, form labels |
| text-base | 1rem | Body |
| text-lg | 1.125rem | Lead paragraphs |
| text-xl | 1.25rem | h4 |
| text-2xl | 1.5rem | h3 |
| text-4xl | 2.25rem | h1, body pages |
| text-6xl | 3.75rem | Hero headlines |

**Line height:** 1.6 for body, 1.2 for display.

## Spacing scale

Tailwind defaults. Common values: 2 (8px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px), 24 (96px).

## Border radius

| Token | Value | Use |
|---|---|---|
| rounded-sm | 4px | Inputs, badges |
| rounded-md | 6px | Buttons (default) |
| rounded-lg | 8px | Cards |
| rounded-xl | 12px | Modals, large panels |
| rounded-full | 9999px | Avatars, pill buttons |

## Shadows

```css
--shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
--shadow-md: 0 4px 12px rgb(0 0 0 / 0.5);
--shadow-lg: 0 12px 32px rgb(0 0 0 / 0.6);
--shadow-glow: 0 0 24px var(--color-accent-faint);
```

Use sparingly on dark theme, depth comes from surface lightness, not shadow.

## Components

### Button, primary
```tsx
<button className="bg-accent text-bg px-4 py-2 rounded-md font-semibold hover:bg-accent-hover transition-colors">
  Action
</button>
```

### Button, secondary
```tsx
<button className="bg-surface text-text px-4 py-2 rounded-md border border-border hover:bg-surface-elevated transition-colors">
  Cancel
</button>
```

### Input
```tsx
<input className="bg-surface border border-border rounded-md px-3 py-2 text-text placeholder-text-faint focus:border-accent focus:outline-none transition-colors" />
```

### Card
```tsx
<div className="bg-surface border border-border rounded-lg p-6">
  ...
</div>
```

## Animation defaults

- Hover transitions: transition-colors duration-150 ease-out
- Modal/drawer enter: transition-all duration-200 ease-out
- Maximum UI animation: 300ms

Always wrapped in `prefers-reduced-motion` (see globals.css).

## Dark mode notes

Dark-first, no light mode unless added explicitly.

- Background never pure black, uses `--color-bg`, a near-black
- Text never pure white, uses `--color-text`
- Elevation via `--color-surface-elevated` and border, not shadow

## Focus indicators

Always visible, never `outline: none` without a replacement:

```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```
