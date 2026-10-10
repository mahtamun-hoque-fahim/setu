import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { shortUrl } from "@/lib/public-url";
import { CopyButton } from "@/components/copy-button";
import { CreateLinkForm } from "@/components/create-link-form";
import { PageShell } from "@/components/page-shell";
import { panelClass } from "@/components/ui";

export type DashboardLink = {
  id: string;
  slug: string;
  destinationUrl: string;
  createdAt: Date;
  scanCount: number;
};

/** Presentation only. The page does the auth check and the queries. */
export function DashboardView({
  username,
  host,
  links,
}: {
  username: string;
  host: string;
  links: DashboardLink[];
}) {
  const totalScans = links.reduce((sum, link) => sum + link.scanCount, 0);

  return (
    <PageShell username={username}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 md:py-10">
        <div className="border-b-2 border-border pb-6">
          <h1 className="text-3xl font-bold md:text-5xl">Your links</h1>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            {links.length} {links.length === 1 ? "link" : "links"},{" "}
            {totalScans.toLocaleString("en-US")}{" "}
            {totalScans === 1 ? "scan" : "scans"}
          </p>
        </div>

        <div className="mt-8">
          <CreateLinkForm host={host} />
        </div>

        <section className="mt-10" aria-labelledby="all-links-heading">
          <h2 id="all-links-heading" className="text-xl font-bold">
            All links
          </h2>

          {links.length === 0 ? (
            <p className={`${panelClass} mt-4 p-8 text-center md:p-12`}>
              No links yet. Add a slug and a destination above to create your
              first one.
            </p>
          ) : (
            <ul className={`${panelClass} mt-4 divide-y-2 divide-border`}>
              {links.map((link) => (
                <li
                  key={link.id}
                  className="relative grid gap-2 px-4 py-4 hover:bg-accent sm:px-6 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-1 md:col-span-4">
                    <Link
                      href={`/dashboard/${link.id}`}
                      className="truncate font-mono text-sm font-bold after:absolute after:inset-0"
                    >
                      {host}/{link.slug}
                    </Link>
                    <CopyButton
                      variant="icon"
                      value={shortUrl(link.slug)}
                      className="relative z-10"
                    />
                  </div>

                  <p
                    className="min-w-0 truncate font-mono text-xs text-muted-foreground md:col-span-4"
                    title={link.destinationUrl}
                  >
                    <span className="sr-only">Destination: </span>
                    {link.destinationUrl}
                  </p>

                  <p className="font-mono text-xs md:col-span-2 md:text-right">
                    <span className="font-semibold">
                      {link.scanCount.toLocaleString("en-US")}
                    </span>{" "}
                    {link.scanCount === 1 ? "scan" : "scans"}
                  </p>

                  <div className="flex items-center justify-between gap-3 font-mono text-xs md:col-span-2 md:justify-end">
                    <span className="text-muted-foreground">
                      <span className="sr-only">Created </span>
                      {formatDate(link.createdAt)}
                    </span>
                    <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
