"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import {
  buttonPrimary,
  inputClass,
  labelClass,
  panelClass,
} from "@/components/ui";

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
      className={`${panelClass} flex flex-col gap-4 p-5 sm:p-6`}
    >
      <h2 className="text-2xl font-bold">Destination</h2>

      <div>
        <label htmlFor="edit-destination" className={labelClass}>
          Where this link sends people
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id="edit-destination"
            type="url"
            required
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSaved(false);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "edit-destination-error edit-destination-hint" : "edit-destination-hint"
            }
            className={`${inputClass} flex-1 font-mono ${
              error ? "border-destructive" : ""
            }`}
          />
          <button
            type="submit"
            disabled={loading || unchanged}
            className={buttonPrimary}
          >
            {loading && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save
          </button>
        </div>
        <p id="edit-destination-hint" className="mt-3 text-sm text-muted-foreground">
          Changing the destination does not change the slug or the QR code.
          Codes already printed keep working and land on the new destination.
        </p>
      </div>

      {error && (
        <p
          id="edit-destination-error"
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
      {saved && (
        <p
          role="status"
          className="animate-fade-up flex items-start gap-2 border-2 border-border bg-muted p-3 text-sm font-medium shadow-hard-2"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Saved. Scans now land on the new destination.
        </p>
      )}
    </form>
  );
}
