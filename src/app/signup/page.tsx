"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-text">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8"
      >
        <h1 className="font-display text-xl font-semibold">Create an account</h1>

        <label className="mt-6 block text-sm text-text-muted">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm text-text-muted">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm text-text-muted">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </label>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-accent px-4 py-2 font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <a href="/login" className="text-accent hover:text-accent-hover">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
