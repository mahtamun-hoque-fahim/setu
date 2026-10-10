"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Loader2, Plus } from "lucide-react";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

export function CreateLinkForm({ host }: { host: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSlugError(null);
    setUrlError(null);
    setFormError(null);
    setLoading(true);

    let res: Response;
    try {
      res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, destinationUrl }),
      });
    } catch {
      setLoading(false);
      setFormError("Could not reach the server, check your connection");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      const message = await res.text();
      // The server words these for people: 409 is always about the slug
      // (taken or reserved), 400 is about the destination URL.
      if (res.status === 409) setSlugError(message);
      else if (res.status === 400) setUrlError(message);
      else if (res.status === 401) setFormError("Your session expired, sign in again");
      else setFormError("Something went wrong, try again");
      return;
    }

    setSlug("");
    setDestinationUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`${panelClass} p-5 sm:p-7`}>
      <h2 className="text-xl font-bold md:text-2xl">Create a short link</h2>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <label htmlFor="slug" className={labelClass}>
            Short link
          </label>
          <div
            className={`mt-1.5 flex min-h-11 items-center border-2 bg-background px-3 focus-within:border-primary has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
              slugError ? "border-destructive" : "border-input"
            }`}
          >
            <span
              className="shrink-0 font-mono text-sm text-muted-foreground"
              aria-hidden="true"
            >
              {host}/
            </span>
            <input
              id="slug"
              type="text"
              required
              pattern="[a-zA-Z0-9\-]+"
              title="Letters, numbers and hyphens only"
              placeholder="your-name"
              autoComplete="off"
              spellCheck={false}
              value={slug}
              onChange={(e) => setSlug(e.target.value.trim())}
              aria-invalid={slugError ? true : undefined}
              aria-describedby={slugError ? "slug-error" : "slug-hint"}
              className="min-h-10 w-full bg-transparent py-2 pl-1 font-mono text-sm placeholder:text-muted-foreground focus-visible:outline-hidden"
            />
          </div>
          {slugError ? (
            <p
              id="slug-error"
              role="alert"
              className="animate-fade-up mt-2 flex items-start gap-1.5 text-sm font-medium text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {slugError}
            </p>
          ) : (
            <p id="slug-hint" className="mt-2 text-sm text-muted-foreground">
              Letters, numbers and hyphens. It cannot be renamed later.
            </p>
          )}
        </div>

        <div className="lg:col-span-6">
          <label htmlFor="destinationUrl" className={labelClass}>
            Destination URL
          </label>
          <input
            id="destinationUrl"
            type="url"
            required
            placeholder="https://yourwebsite.com/page"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            aria-invalid={urlError ? true : undefined}
            aria-describedby={urlError ? "url-error" : "url-hint"}
            className={`${inputClass} mt-1.5 font-mono ${
              urlError ? "border-destructive" : ""
            }`}
          />
          {urlError ? (
            <p
              id="url-error"
              role="alert"
              className="animate-fade-up mt-2 flex items-start gap-1.5 text-sm font-medium text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {urlError}
            </p>
          ) : (
            <p id="url-hint" className="mt-2 text-sm text-muted-foreground">
              Only http and https links. You can change this later.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 lg:pt-[1.625rem]">
          <button type="submit" disabled={loading} className={`${buttonPrimary} w-full`}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            Create link
          </button>
        </div>
      </div>

      {formError && (
        <p role="alert" className="animate-fade-up mt-4 text-sm font-medium text-destructive">
          {formError}
        </p>
      )}
    </form>
  );
}
