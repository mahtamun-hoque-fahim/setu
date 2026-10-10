/**
 * Shared class strings for the Brutalist White look: 2px black borders, hard
 * offset shadows that collapse when pressed, 44px minimum touch targets.
 * Colours come from tokens only, see globals.css.
 */

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-border px-4 py-2 text-sm font-semibold shadow-hard-3 transition-[transform,box-shadow,background-color] duration-75 ease-out enabled:hover:translate-x-px enabled:hover:translate-y-px enabled:hover:shadow-hard-2 enabled:active:translate-x-[3px] enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:opacity-60";

export const buttonPrimary = `${buttonBase} bg-primary text-primary-foreground enabled:hover:bg-primary/90`;

export const buttonSecondary = `${buttonBase} bg-secondary text-secondary-foreground enabled:hover:bg-muted`;

export const inputClass =
  "min-h-11 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary";

export const panelClass = "border-2 border-border bg-card shadow-hard-4";

export const labelClass = "block text-sm font-semibold";
