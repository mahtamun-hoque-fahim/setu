# Setu, Design Guide

Implementation spec for the design system. No rationale, no marketing copy. Just tokens, patterns, and constraints.

Direction: Brutalist White. Light only, hard edges, 2px black structure, hard offset shadows, one blue accent. Designed in Google Stitch (October 2026), then rebuilt by hand on the tokens below. The Stitch HTML uses the Tailwind CDN, Material Symbols and Google Font links, so it is a reference only and is never committed.

## Color tokens

Standard token names (`:root` variables mapped through `@theme inline` in `src/app/globals.css`). Components use `bg-background`, `text-foreground`, `bg-primary` and so on, never raw hex in a class name. Contrast verified with the chameleon `check_palette.py` script.

| Token | Value | Use |
|---|---|---|
| background | #ffffff | page |
| foreground | #000000 | text, borders, table headers |
| card | #ffffff | panels |
| primary | #0047ff | the single brand colour: primary buttons, links, the new URL in edit history |
| primary-foreground | #ffffff | text on primary |
| secondary | #ffffff | secondary buttons |
| muted | #f4f5f7 | zebra rows, subdued panels |
| muted-foreground | #525252 | secondary text |
| accent | #e8edff | hover and selected background only |
| destructive | #d90429 | errors |
| success, warning, info | #0b7a3b, #8a5700, #0b5cad | defined, not used yet |
| border, input | #000000 | structure, form fields |
| ring | #0047ff | focus outline |

Soft dividers use `border-foreground/20`, not a token. `#00e676` is banned as an accent. No dark mode: there is no `.dark` block.

## Typography

Loaded with `@fontsource` in `src/app/layout.tsx` (static weights, no Google Fonts requests).

| Role | Family | Weights | Notes |
|---|---|---|---|
| Headings and body | Space Grotesk | 400, 500, 600, 700 | `font-sans`, `font-heading` |
| Slugs, URLs, numbers, timestamps | JetBrains Mono | 400, 500, 600 | `font-mono` |
| Bengali (wordmark, About page) | Hind Siliguri | 400, 700 | `font-bengali`, also second in the sans stack because Space Grotesk has no Bengali glyphs |

- Headings are sentence case, bold, `letter-spacing: -0.02em`, `text-wrap: balance`
- Uppercase is used only for table column headers
- No small uppercase or mono label above a heading, no tag chips
- Type scale is the Tailwind default, no arbitrary sizes (`text-[..]`)

## Shape and shadow

- Radius is 0 everywhere. Do not use `rounded-*` except `rounded-none` on form controls
- Panels: `border-2 border-border bg-card shadow-hard-4`
- Hard shadows: `shadow-hard-2`, `shadow-hard-3`, `shadow-hard-4` (offset in px, colour is `foreground`)
- Shared class strings live in `src/components/ui.ts`: `buttonPrimary`, `buttonSecondary`, `inputClass`, `panelClass`, `labelClass`

## Components

### Buttons
- 2px black border, `shadow-hard-3`, minimum height 44px
- Hover moves 1px toward the shadow and shrinks it to `shadow-hard-2`. Press moves 3px and removes the shadow. 75ms
- Primary is blue with white text, secondary is white with black text
- Disabled is 60% opacity with no movement (`enabled:` variants only)
- Icon-only buttons are 44px squares with an `aria-label`

### Inputs
- 2px black border, no radius, 44px minimum height, monospace for URLs and slugs
- Focus: border turns blue plus the global 3px blue outline with 2px offset (`*:focus-visible`)
- Invalid: red border, `aria-invalid`, message with an icon and `role="alert"` linked by `aria-describedby`
- Every input has a visible `<label>`. The slug field shows the host as a non-editable prefix

### Panels
- Section panels use `panelClass` with an `h2`. Tables sit inside a 2px bordered scroll region that is focusable and labelled
- Table header is a black row with white uppercase text, body rows alternate `bg-muted`, hover is `bg-accent`
- List rows (dashboard) are one stretched link per row, copy button above it with `relative z-10`

### Status messages
- Success and error boxes: 2px border, `shadow-hard-2`, icon plus text. Errors use `role="alert"`, success uses `role="status"`
- Colour is never the only signal, there is always an icon and words

## Layout

- Page container: `max-w-7xl`, `px-4 sm:px-8`
- Every page is wrapped in `PageShell`: skip link, header, `<main id="main">`, footer
- Header signed out: wordmark, About, Sign in. Signed in: wordmark, username, Sign out. No navigation menu
- Footer: wordmark, tagline, About, copyright

## Pages

Landing, About, Sign in and create account, Dashboard, Link detail, 404. Mobile checked at 375px, desktop at 1280px.

## Animation defaults

- Press and hover on buttons only, 75ms
- `fade-up` (250ms, 6px) for error and success messages
- `prefers-reduced-motion` collapses every duration to near zero
- No page transitions, no parallax, no decorative motion

## Accessibility

- Minimum 44px touch targets on buttons, inputs and icon buttons
- Visible keyboard focus everywhere, skip link on every page
- Bengali text is marked `lang="bn"`
- Decorative icons are `aria-hidden`, informative ones have text
- Old and new URLs in edit history carry screen-reader text ("Changed from", "to") because strikethrough alone is visual

## Removed from the Stitch export

Not built on purpose: Studio, Analytics, API and Docs, Overview and Bridges navigation, the signed-out avatar icon, the throughput sparkline widget, per-row QR download on the dashboard, the dashboard filter box, Forgot password, the Terms and Help and System Status links, the "Operational" chip, "HTTP 301" badges, and every uppercase tag chip. Each either has no matching feature or states something untrue.
