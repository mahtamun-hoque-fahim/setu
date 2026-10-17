"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { PageShell } from "@/components/page-shell";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

export default function JoinPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The invite link carries the email and code after a "#", so neither is ever
  // sent to the server or written to a request log. Read them once, then wipe
  // them from the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const linkEmail = params.get("email");
    const linkCode = params.get("code");
    if (linkEmail || linkCode) {
      // Reading the URL after mount is the point of this effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (linkEmail) setEmail(linkEmail);
      if (linkCode) setCode(linkCode);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // inviteCode is not part of Better Auth's typed body. The server-side
    // check reads it from the request, which is where the lock lives.
    const { error: authError } = await signUp.email({
      email,
      password,
      name,
      inviteCode: code,
    } as Parameters<typeof signUp.email>[0]);

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <PageShell showSignIn={false}>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl">Join Setu</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Use the invite code you were sent, with the same email address it was
          sent to.
        </p>

        <form onSubmit={handleSubmit} className={`${panelClass} mt-8 flex flex-col gap-5 p-6 sm:p-8`}>
          <div>
            <label htmlFor="email" className={labelClass}>Email address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label htmlFor="code" className={labelClass}>Invite code</label>
            <input
              id="code"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputClass} mt-1.5 font-mono uppercase`}
            />
          </div>

          <div>
            <label htmlFor="name" className={labelClass}>Your name</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
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
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
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
            Create account
          </button>

          <p className="text-sm text-muted-foreground">
            I store your name, email and a hash of your password. See the{" "}
            <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:text-primary">
              privacy page
            </Link>
            .
          </p>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          No invite yet?{" "}
          <Link href="/request-access" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Request one
          </Link>
          . Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Sign in
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
