"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function CreateLinkForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, destinationUrl }),
    });

    setLoading(false);

    if (!res.ok) {
      const message = await res.text();
      setError(
        res.status === 409
          ? message // "That slug is reserved" or "That slug is already taken"
          : res.status === 400
            ? "Enter both a slug and a destination URL"
            : "Something went wrong, try again",
      );
      return;
    }

    setSlug("");
    setDestinationUrl("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="slug" className="text-sm text-text-muted">
            Slug
          </label>
          <div className="mt-1 flex items-center rounded-md border border-border bg-surface-elevated px-3">
            <span className="text-sm text-text-faint">/</span>
            <input
              id="slug"
              type="text"
              required
              pattern="[a-zA-Z0-9\-]+"
              placeholder="mahtamun"
              value={slug}
              onChange={(e) => setSlug(e.target.value.trim())}
              className="w-full bg-transparent px-1 py-2 text-sm text-text placeholder-text-faint focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-[2]">
          <label htmlFor="destinationUrl" className="text-sm text-text-muted">
            Destination URL
          </label>
          <input
            id="destinationUrl"
            type="url"
            required
            placeholder="https://facebook.com/yourpage"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text placeholder-text-faint focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          Create
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
