"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { PageShell } from "@/components/page-shell";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function chooseMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } =
      mode === "sign-in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong");
      return;
    }

    router.push("/dashboard");
  }

  const segment = (active: boolean) =>
    `min-h-11 text-sm font-bold transition-colors duration-75 ${
      active ? "bg-foreground text-background" : "hover:bg-muted"
    }`;

  return (
    <PageShell showSignIn={false}>
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
        <div className="flex items-baseline gap-3">
          <p className="font-heading text-5xl font-bold tracking-tighter">Setu</p>
          <p lang="bn" className="font-bengali text-5xl font-bold">
            সেতু
          </p>
        </div>
        <p className="mt-3 text-center text-muted-foreground">
          The bridge, not the detour.
        </p>

        <div className={`${panelClass} mt-8 w-full p-6 sm:p-8`}>
          <h1 className="sr-only">
            {mode === "sign-in" ? "Sign in" : "Create an account"}
          </h1>

          <div
            role="group"
            aria-label="Choose what to do"
            className="grid grid-cols-2 gap-1 border-2 border-border p-1"
          >
            <button
              type="button"
              aria-pressed={mode === "sign-in"}
              onClick={() => chooseMode("sign-in")}
              className={segment(mode === "sign-in")}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={mode === "sign-up"}
              onClick={() => chooseMode("sign-up")}
              className={segment(mode === "sign-up")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {mode === "sign-up" && (
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} mt-1.5`}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 inline-flex size-11 items-center justify-center hover:text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="animate-fade-up flex items-start gap-2 border-2 border-border bg-background p-3 text-sm font-medium shadow-hard-2"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={buttonPrimary}>
              {loading && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {mode === "sign-in" ? "Sign in to Setu" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No ads. Your scan data stays in your dashboard.
        </p>
      </div>
    </PageShell>
  );
}
