import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import {
  adminCounts,
  listAccounts,
  listAllLinks,
  listBlockedHosts,
  listInvites,
  listRequests,
} from "@/lib/admin-data";
import { ADMIN_TABS, AdminView, type AdminTab } from "@/components/admin-view";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Anyone who is not the admin gets the same 404 as a page that does not exist.
  const session = await requireAdmin();

  const { tab: requested } = await searchParams;
  const tab: AdminTab = ADMIN_TABS.find((t) => t === requested) ?? "requests";

  const db = getDb();
  const [counts, requests, invites, accounts, links, blockedHosts] = await Promise.all([
    adminCounts(db),
    tab === "requests" ? listRequests(db) : undefined,
    tab === "invites" ? listInvites(db) : undefined,
    tab === "accounts" ? listAccounts(db) : undefined,
    tab === "links" ? listAllLinks(db) : undefined,
    tab === "links" ? listBlockedHosts(db) : undefined,
  ]);

  return (
    <AdminView
      username={session.user.name || session.user.email}
      tab={tab}
      counts={counts}
      requests={requests}
      invites={invites}
      accounts={accounts}
      links={links}
      blockedHosts={blockedHosts}
    />
  );
}
