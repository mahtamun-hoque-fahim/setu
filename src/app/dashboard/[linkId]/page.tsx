import { headers } from "next/headers";
import { and, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { linkEdits, links, scans } from "@/lib/db/schema";
import { parseUserAgent } from "@/lib/parse-user-agent";
import { LinkQrCode } from "@/components/link-qr-code";
import { EditDestinationForm } from "@/components/edit-destination-form";

const backLinkClass =
  "inline-flex items-center gap-2 text-sm text-text-muted transition-colors duration-150 ease-out hover:text-text";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const db = getDb();

  // Scoped to the signed-in owner, not just the id, so one user can never
  // view another user's link by guessing or sharing a linkId.
  const link = await db.query.links.findFirst({
    where: and(eq(links.id, linkId), eq(links.ownerId, session.user.id)),
  });

  if (!link) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12 text-text">
        <div className="mx-auto max-w-3xl">
          <Link href="/dashboard" className={backLinkClass}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to your links
          </Link>
          <p className="animate-fade-up mt-6 text-text-muted">
            That link does not exist, or is not yours.
          </p>
        </div>
      </main>
    );
  }

  const linkScans = await db.query.scans.findMany({
    where: eq(scans.linkId, link.id),
    orderBy: desc(scans.scannedAt),
  });

  // Most recent 20 edits is plenty for a glance, the table is indexed on
  // (link_id, edited_at) so this stays cheap.
  const edits = await db.query.linkEdits.findMany({
    where: eq(linkEdits.linkId, link.id),
    orderBy: desc(linkEdits.editedAt),
    limit: 20,
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`;

  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className={backLinkClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to your links
        </Link>

        <div className="animate-fade-up mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold">/{link.slug}</h1>
            <p className="mt-1 truncate text-sm text-text-faint">
              {link.destinationUrl}
            </p>
          </div>
          <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-muted">
            {linkScans.length} scans
          </span>
        </div>

        <div className="animate-fade-up mt-6" style={{ animationDelay: "30ms" }}>
          <EditDestinationForm
            linkId={link.id}
            currentUrl={link.destinationUrl}
          />
        </div>

        <div className="mt-6">
          <LinkQrCode url={publicUrl} slug={link.slug} />
        </div>

        {edits.length > 0 && (
          <section
            className="animate-fade-up mt-8"
            style={{ animationDelay: "45ms" }}
          >
            <h2 className="font-display text-lg font-bold">Edit history</h2>
            <ol className="mt-3 space-y-2">
              {edits.map((edit) => (
                <li
                  key={edit.id}
                  className="rounded-lg border border-border bg-surface p-3 text-sm"
                >
                  <p className="text-text-muted">
                    {new Date(edit.editedAt).toLocaleString()}
                  </p>
                  <p className="mt-1 break-all text-text-faint">
                    <span className="sr-only">From </span>
                    {edit.previousUrl}
                  </p>
                  <p className="mt-1 break-all text-text">
                    <span className="text-text-muted">To </span>
                    {edit.newUrl}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {linkScans.length === 0 ? (
          <p
            className="animate-fade-up mt-8 text-text-muted"
            style={{ animationDelay: "60ms" }}
          >
            No scans yet. They will show up here as soon as this link gets
            used.
          </p>
        ) : (
          <div
            className="animate-fade-up mt-8 overflow-x-auto rounded-lg border border-border"
            style={{ animationDelay: "60ms" }}
          >
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Scan history for /{link.slug}, newest first
              </caption>
              <thead className="bg-surface text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Device
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Browser
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Country
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Referrer
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Sent to
                  </th>
                </tr>
              </thead>
              <tbody>
                {linkScans.map((scan) => {
                  const { device, browser } = parseUserAgent(scan.userAgent);
                  return (
                    <tr
                      key={scan.id}
                      className="border-t border-border bg-surface-elevated transition-colors duration-150 ease-out hover:bg-surface"
                    >
                      <td className="px-4 py-2 text-text-muted">
                        {new Date(scan.scannedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{device}</td>
                      <td className="px-4 py-2">{browser}</td>
                      <td className="px-4 py-2">{scan.country ?? "Unknown"}</td>
                      <td className="px-4 py-2 truncate max-w-[10rem] text-text-faint">
                        {scan.referrer ?? "Direct"}
                      </td>
                      <td
                        className="px-4 py-2 truncate max-w-[12rem] text-text-faint"
                        title={scan.destinationUrl ?? undefined}
                      >
                        {scan.destinationUrl ?? "Not recorded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
