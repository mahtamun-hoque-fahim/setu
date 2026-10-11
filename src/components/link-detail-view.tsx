import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { linkEdits, links, scans } from "@/lib/db/schema";
import {
  countryName,
  formatDateTimeUtc,
  formatWhen,
  referrerHost,
} from "@/lib/format";
import { parseUserAgent } from "@/lib/parse-user-agent";
import { CopyButton } from "@/components/copy-button";
import { EditDestinationForm } from "@/components/edit-destination-form";
import { LinkQrCode } from "@/components/link-qr-code";
import { PageShell } from "@/components/page-shell";
import { panelClass } from "@/components/ui";

type LinkRow = typeof links.$inferSelect;
type ScanRow = typeof scans.$inferSelect;
type EditRow = typeof linkEdits.$inferSelect;

/** Presentation only. The page does the auth check and the queries. */
export function LinkDetailView({
  username,
  host,
  publicUrl,
  link,
  total,
  recentScans,
  edits,
}: {
  username: string;
  host: string;
  publicUrl: string;
  link: LinkRow;
  total: number;
  recentScans: ScanRow[];
  edits: EditRow[];
}) {
  return (
    <PageShell username={username}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 md:py-10">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold hover:underline hover:decoration-2 hover:underline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to your links
        </Link>

        <div className="flex flex-col gap-4 border-b-2 border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="break-all font-mono text-2xl font-bold tracking-tight md:text-3xl">
              {host}/{link.slug}
            </h1>
            <CopyButton value={publicUrl} />
          </div>
          <p className="font-mono text-sm">
            <span className="font-semibold">
              {total.toLocaleString("en-US")}
            </span>{" "}
            {total === 1 ? "scan" : "scans"}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EditDestinationForm
              linkId={link.id}
              currentUrl={link.destinationUrl}
            />
          </div>
          <div className="lg:col-span-5">
            <LinkQrCode url={publicUrl} slug={link.slug} />
          </div>
        </div>

        {edits.length > 0 && (
          <section
            aria-labelledby="history-heading"
            className={`${panelClass} flex flex-col gap-4 p-5 sm:p-6`}
          >
            <h2 id="history-heading" className="text-2xl font-bold">
              Edit history
            </h2>
            <ol className="divide-y-2 divide-border border-y-2 border-border">
              {edits.map((edit) => (
                <li
                  key={edit.id}
                  className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:gap-6"
                >
                  <time
                    dateTime={edit.editedAt.toISOString()}
                    className="shrink-0 font-mono text-xs font-medium md:w-52"
                  >
                    {formatDateTimeUtc(edit.editedAt)}
                  </time>
                  <p className="flex min-w-0 flex-col items-start gap-1.5 font-mono text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                    <span className="sr-only">Changed from</span>
                    <span className="break-all text-muted-foreground line-through">
                      {edit.previousUrl}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 rotate-90 sm:rotate-0" aria-hidden="true" />
                    <span className="sr-only">to</span>
                    <span className="break-all font-semibold text-primary">
                      {edit.newUrl}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section
          aria-labelledby="scans-heading"
          className={`${panelClass} flex flex-col gap-4 p-5 sm:p-6`}
        >
          <h2 id="scans-heading" className="text-2xl font-bold">
            Scans
          </h2>

          {recentScans.length === 0 ? (
            <p className="text-muted-foreground">
              No scans yet. They will show up here as soon as this link gets
              used.
            </p>
          ) : (
            <>
              <div
                role="region"
                aria-label="Scan history, scrolls sideways on small screens"
                tabIndex={0}
                className="overflow-x-auto border-2 border-border"
              >
                <table className="w-full min-w-3xl border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Scans of {host}/{link.slug}, newest first
                  </caption>
                  <thead>
                    <tr className="bg-foreground text-background">
                      {["Time", "Device", "Country", "Referrer", "Sent to"].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-border">
                    {recentScans.map((scan) => {
                      const { device, browser } = parseUserAgent(scan.userAgent);
                      return (
                        <tr key={scan.id} className="even:bg-muted hover:bg-accent">
                          <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                            <time
                              dateTime={scan.scannedAt.toISOString()}
                              title={formatDateTimeUtc(scan.scannedAt)}
                            >
                              {formatWhen(scan.scannedAt)}
                            </time>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            {device === "Unknown"
                              ? "Unknown"
                              : browser === "Unknown"
                                ? device
                                : `${device}, ${browser}`}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            {countryName(scan.country)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            {referrerHost(scan.referrer)}
                          </td>
                          <td
                            className="max-w-72 truncate px-4 py-2.5 font-mono text-xs"
                            title={scan.destinationUrl ?? undefined}
                          >
                            {scan.destinationUrl ?? (
                              <span className="text-muted-foreground">
                                Not recorded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground lg:hidden">
                Scroll sideways to see every column.
              </p>
              {total > recentScans.length && (
                <p className="text-sm text-muted-foreground">
                  Showing the latest {recentScans.length} of{" "}
                  {total.toLocaleString("en-US")} scans.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
