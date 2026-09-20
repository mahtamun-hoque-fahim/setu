import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { SignOutButton } from "@/components/sign-out-button";
import { CreateLinkForm } from "@/components/create-link-form";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // The proxy already redirects unauthenticated visitors, this is the
  // server-side confirmation that never trusts the client alone.
  if (!session) {
    return null;
  }

  const db = getDb();
  const myLinks = await db.query.links.findMany({
    where: eq(links.ownerId, session.user.id),
    with: { scans: true },
  });

  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Your links</h1>
          <SignOutButton />
        </div>

        <div className="mt-6">
          <CreateLinkForm />
        </div>

        {myLinks.length === 0 ? (
          <p className="mt-6 text-text-muted">
            No links yet. Create one to get started.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {myLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={`/dashboard/${link.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-elevated"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">/{link.slug}</span>
                    <span className="text-sm text-text-muted">
                      {link.scans.length} scans
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-text-faint">
                    {link.destinationUrl}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
