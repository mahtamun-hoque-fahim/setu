"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageShell } from "@/components/page-shell";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signIn.email({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong");
      return;
    }

    router.push("/dashboard");
  }

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

        <form onSubmit={handleSubmit} className={`${panelClass} mt-8 flex w-full flex-col gap-5 p-6 sm:p-8`}>
          <h1 className="text-2xl font-bold">Sign in</h1>

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
                autoComplete="current-password"
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
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={buttonPrimary}>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Sign in to Setu
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Setu is invite-only. Have an invite code?{" "}
          <Link href="/join" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Join Setu
          </Link>
          . No invite yet?{" "}
          <Link href="/request-access" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Request one
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
