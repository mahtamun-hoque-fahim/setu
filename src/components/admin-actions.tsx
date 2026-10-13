"use client";

import { useState, useTransition } from "react";
import { Check, CircleAlert, Copy } from "lucide-react";
import {
  addBlockedHostAction,
  approveRequestAction,
  deleteAccountAction,
  disableLinkAction,
  enableLinkAction,
  rejectRequestAction,
  removeBlockedHostAction,
  revokeInviteAction,
  type ApprovalResult,
} from "@/app/admin/actions";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";

const small = "min-h-9 px-3 py-1 text-xs";

function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function RequestActions({
  id,
  name,
  email,
  status,
}: {
  id: string;
  name: string;
  email: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [issued, setIssued] = useState<Extract<ApprovalResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function approve() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await approveRequestAction(id);
        if (result.ok) setIssued(result);
        else setError(result.error);
      } catch {
        setError("Something went wrong, try again");
      }
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      try {
        await rejectRequestAction(id);
      } catch {
        setError("Something went wrong, try again");
      }
    });
  }

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy, select the link and copy it by hand");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            aria-label={`Approve ${name}, ${email}`}
            className={`${buttonPrimary} ${small}`}
          >
            Approve
          </button>
        ) : (
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            aria-label={`Issue a new invite for ${email}`}
            className={`${buttonSecondary} ${small}`}
          >
            Issue a new invite
          </button>
        )}
        {status === "pending" && (
          <button
            type="button"
            onClick={reject}
            disabled={pending}
            aria-label={`Reject ${name}, ${email}`}
            className={`${buttonSecondary} ${small}`}
          >
            Reject
          </button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {issued && (
        <div className="flex flex-col gap-2 border-2 border-border bg-muted p-3 shadow-hard-2" role="status">
          <p className="text-sm font-semibold">
            Invite for {issued.email}. Send them this link, it is shown only once.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={issued.joinUrl}
              aria-label={`Invite link for ${issued.email}`}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} flex-1 font-mono text-xs`}
            />
            <button type="button" onClick={copy} className={`${buttonSecondary} ${small}`}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Works once, only with {issued.email}, until {new Date(issued.expiresAt).toUTCString()}. Setu stores only a hash of the code,
            so if you lose this link, issue a new one.
          </p>
        </div>
      )}
    </div>
  );
}

export function RevokeInviteButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await revokeInviteAction(id); })}
      aria-label={`Revoke the invite for ${email}`}
      className={`${buttonSecondary} ${small}`}
    >
      Revoke
    </button>
  );
}

export function LinkActions({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  if (status === "disabled") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await enableLinkAction(id); })}
        aria-label={`Enable the link ${slug}`}
        className={`${buttonSecondary} ${small}`}
      >
        Enable
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={reason}
        maxLength={200}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        aria-label={`Reason for disabling ${slug}`}
        className={`${inputClass} min-h-9 py-1 text-xs sm:w-40`}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await disableLinkAction(id, reason); setReason(""); })}
        aria-label={`Disable the link ${slug}`}
        className={`${buttonSecondary} ${small}`}
      >
        Disable
      </button>
    </div>
  );
}

export function BlockedHostsPanel({
  hosts,
}: {
  hosts: { host: string; reason: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  const [host, setHost] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await addBlockedHostAction(host, reason);
      if (result.ok) {
        setMessage({
          ok: true,
          text: `${result.host} is blocked. ${result.disabled} existing ${result.disabled === 1 ? "link" : "links"} disabled.`,
        });
        setHost("");
        setReason("");
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="blocked-host" className="block text-sm font-semibold">
            Block a website
          </label>
          <input
            id="blocked-host"
            type="text"
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="evil.example"
            className={`${inputClass} mt-1.5 font-mono`}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="blocked-reason" className="block text-sm font-semibold">
            Reason (optional)
          </label>
          <input
            id="blocked-reason"
            type="text"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          Block
        </button>
      </form>

      {message &&
        (message.ok ? (
          <p role="status" className="text-sm font-medium">{message.text}</p>
        ) : (
          <ErrorNote message={message.text} />
        ))}

      {hosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blocked websites yet.</p>
      ) : (
        <ul className="divide-y-2 divide-border border-2 border-border">
          {hosts.map((item) => (
            <li key={item.host} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0 font-mono text-sm">
                {item.host}
                {item.reason && <span className="text-muted-foreground"> ({item.reason})</span>}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => { await removeBlockedHostAction(item.host); })}
                aria-label={`Unblock ${item.host}`}
                className={`${buttonSecondary} ${small}`}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DeleteAccountButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete the account ${email}`}
        className={`${buttonSecondary} ${small}`}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex max-w-64 flex-col gap-2" role="group" aria-label={`Confirm deleting ${email}`}>
      <p className="text-xs leading-relaxed">
        Delete {email} with all their links, scans, history and invite records? This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteAccountAction(id);
              if (!result.ok) {
                setError(result.error);
                setConfirming(false);
              }
            })
          }
          className={`${buttonPrimary} ${small}`}
        >
          Yes, delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={`${buttonSecondary} ${small}`}>
          Cancel
        </button>
      </div>
      {error && <ErrorNote message={error} />}
    </div>
  );
}
