"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, Loader2, MailCheck } from "lucide-react";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

export function RequestAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, real people leave it empty
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let res: Response;
    try {
      res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, note, website }),
      });
    } catch {
      setLoading(false);
      setError("Could not reach the server, check your connection and try again");
      return;
    }
    setLoading(false);

    if (!res.ok) {
      setError(
        res.status === 400 || res.status === 503
          ? await res.text()
          : "Something went wrong, try again",
      );
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className={`${panelClass} flex flex-col gap-3 p-6 sm:p-8`}
      >
        <MailCheck className="size-6 text-primary" aria-hidden="true" />
        <h2 className="text-2xl font-bold">Request received</h2>
        <p className="leading-relaxed text-muted-foreground">
          I approve people I know, one by one. If we know each other, I will
          send you an invite link. It works only with the email you just gave
          me, and only once.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center self-start text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${panelClass} flex flex-col gap-5 p-6 sm:p-8`}
    >
      <div>
        <label htmlFor="name" className={labelClass}>
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} mt-1.5`}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby="email-hint"
          className={`${inputClass} mt-1.5`}
        />
        <p id="email-hint" className="mt-2 text-sm text-muted-foreground">
          Your invite will only work with this email.
        </p>
      </div>

      <div>
        <label htmlFor="note" className={labelClass}>
          How do we know each other? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${inputClass} mt-1.5 resize-y`}
        />
      </div>

      {/* Honeypot. Hidden from people and from screen readers, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
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
        Request an invite
      </button>

      <p className="text-sm text-muted-foreground">
        I use your name, email and note only to decide on your invite. Read the{" "}
        <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:text-primary">
          privacy page
        </Link>
        .
      </p>
    </form>
  );
}
