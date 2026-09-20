"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-text">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="font-display text-xl font-semibold">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "sign-up" && (
            <div>
              <label htmlFor="name" className="text-sm text-text-muted">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text placeholder-text-faint focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-sm text-text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text placeholder-text-faint focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text placeholder-text-faint focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
          }}
          className="mt-4 text-sm text-text-muted hover:text-text"
        >
          {mode === "sign-in"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
