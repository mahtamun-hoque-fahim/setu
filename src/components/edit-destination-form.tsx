"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export function EditDestinationForm({
  linkId,
  currentUrl,
}: {
  linkId: string;
  currentUrl: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(currentUrl);
  const [savedUrl, setSavedUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const unchanged = url.trim() === savedUrl;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    let res: Response;
    try {
      res = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl: url }),
      });
    } catch {
      setLoading(false);
      setError("Could not reach the server, check your connection and try again");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      const message = await res.text();
      setError(
        res.status === 400
          ? message // what is wrong with the URL, in the server's own wording
          : res.status === 404
            ? "That link no longer exists, or is not yours"
            : res.status === 401
              ? "Your session expired, sign in again"
              : "Something went wrong, try again",
      );
      return;
    }

    // Use the server's normalized value so the button state stays accurate.
    const updated = (await res.json()) as { destinationUrl: string };
    setUrl(updated.destinationUrl);
    setSavedUrl(updated.destinationUrl);
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-surface p-4"
    >
      <label htmlFor="edit-destination" className="text-sm text-text-muted">
        Destination URL
      </label>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row">
        <input
          id="edit-destination"
          type="url"
          required
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSaved(false);
          }}
          aria-describedby="edit-destination-hint"
          className="w-full flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text placeholder-text-faint transition-[border-color,box-shadow] duration-150 ease-out focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={loading || unchanged}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] disabled:active:scale-100 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Save
        </button>
      </div>

      <p id="edit-destination-hint" className="mt-2 text-sm text-text-faint">
        Changing the destination does not change the slug or the QR code.
        Codes already printed keep working and land on the new destination.
      </p>

      {error && (
        <p className="animate-fade-up mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="animate-fade-up mt-3 text-sm text-success" role="status">
          Saved. Scans now land on the new destination.
        </p>
      )}
    </form>
  );
}
