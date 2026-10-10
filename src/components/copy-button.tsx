"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonSecondary } from "@/components/ui";

type Props = {
  value: string;
  /** "text" shows a labelled button, "icon" a compact square for list rows. */
  variant?: "text" | "icon";
  className?: string;
};

export function CopyButton({ value, variant = "text", className = "" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1800);
  }

  const Icon = state === "copied" ? Check : Copy;
  const label =
    state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${label} ${value}`}
        title={label}
        className={`inline-flex size-11 shrink-0 items-center justify-center border-2 border-transparent hover:border-border hover:bg-background ${className}`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${buttonSecondary} ${className}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span aria-live="polite">{label}</span>
    </button>
  );
}
