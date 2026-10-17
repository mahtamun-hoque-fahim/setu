import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import type {
  adminCounts,
  listAccounts,
  listAllLinks,
  listBlockedHosts,
  listInvites,
  listRequests,
} from "@/lib/admin-data";
import { formatDate, formatDateTimeUtc } from "@/lib/format";
import { inviteStatus } from "@/lib/invites";
import {
  BlockedHostsPanel,
  DeleteAccountButton,
  LinkActions,
  RequestActions,
  RevokeInviteButton,
} from "@/components/admin-actions";
import { PageShell } from "@/components/page-shell";
import { panelClass } from "@/components/ui";

export const ADMIN_TABS = ["requests", "invites", "accounts", "links"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

type Counts = Awaited<ReturnType<typeof adminCounts>>;

export type AdminViewProps = {
  username: string;
  tab: AdminTab;
  counts: Counts;
  requests?: Awaited<ReturnType<typeof listRequests>>;
  invites?: Awaited<ReturnType<typeof listInvites>>;
  accounts?: Awaited<ReturnType<typeof listAccounts>>;
  links?: Awaited<ReturnType<typeof listAllLinks>>;
  blockedHosts?: Awaited<ReturnType<typeof listBlockedHosts>>;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block border-2 border-border bg-background px-2 py-0.5 font-mono text-xs font-semibold">
      {children}
    </span>
  );
}

const th = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider";
const td = "px-4 py-2.5 align-top";

function Table({
  caption,
  headings,
  children,
}: {
  caption: string;
  headings: string[];
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={`${caption}, scrolls sideways on small screens`}
      tabIndex={0}
      className="overflow-x-auto border-2 border-border"
    >
      <table className="w-full min-w-3xl border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-foreground text-background">
            {headings.map((heading) => (
              <th key={heading} scope="col" className={th}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminView(props: AdminViewProps) {
  const { username, tab, counts } = props;

  const tabLabels: Record<AdminTab, string> = {
    requests: `Requests (${counts.pendingRequests} pending)`,
    invites: `Invites (${counts.liveInvites} live)`,
    accounts: `Accounts (${counts.accounts})`,
    links: `Links (${counts.disabledLinks} disabled)`,
  };

  const pendingRequests = (props.requests ?? []).filter((r) => r.status === "pending");
  const reviewedRequests = (props.requests ?? []).filter((r) => r.status !== "pending");

  return (
    <PageShell username={username}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 md:py-10">
        <div className="border-b-2 border-border pb-6">
          <h1 className="text-3xl font-bold md:text-5xl">Admin</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You see requests, accounts, links and scan counts. You never see
            individual scans.
          </p>
        </div>

        <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
          {ADMIN_TABS.map((name) => (
            <Link
              key={name}
              href={`/admin?tab=${name}`}
              aria-current={tab === name ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border-2 border-border px-4 text-sm font-semibold ${
                tab === name ? "bg-foreground text-background" : "bg-background hover:bg-accent"
              }`}
            >
              {tabLabels[name]}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "requests" && (
            <div className="flex flex-col gap-10">
              <section aria-labelledby="pending-heading">
                <h2 id="pending-heading" className="text-xl font-bold">
                  Pending
                </h2>
                {pendingRequests.length === 0 ? (
                  <p className={`${panelClass} mt-4 p-8 text-center text-muted-foreground`}>
                    No pending requests.
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-4">
                    {pendingRequests.map((request) => (
                      <li key={request.id} className={`${panelClass} flex flex-col gap-3 p-5`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-bold">{request.name}</p>
                          <time dateTime={request.createdAt.toISOString()} className="font-mono text-xs text-muted-foreground">
                            {formatDateTimeUtc(request.createdAt)}
                          </time>
                        </div>
                        <p className="break-all font-mono text-sm">{request.email}</p>
                        {request.note && <p className="text-sm leading-relaxed">{request.note}</p>}
                        <RequestActions
                          id={request.id}
                          name={request.name}
                          email={request.email}
                          status={request.status}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {reviewedRequests.length > 0 && (
                <section aria-labelledby="reviewed-heading">
                  <h2 id="reviewed-heading" className="text-xl font-bold">
                    Reviewed
                  </h2>
                  <ul className={`${panelClass} mt-4 divide-y-2 divide-border`}>
                    {reviewedRequests.map((request) => (
                      <li key={request.id} className="flex flex-col gap-3 px-5 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-bold">{request.name}</p>
                          <p className="break-all font-mono text-xs">{request.email}</p>
                          <Badge>{request.status}</Badge>
                          {request.reviewedAt && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatDate(request.reviewedAt)}
                            </span>
                          )}
                        </div>
                        <RequestActions
                          id={request.id}
                          name={request.name}
                          email={request.email}
                          status={request.status}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {tab === "invites" && (
            <section aria-labelledby="invites-heading">
              <h2 id="invites-heading" className="sr-only">Invites</h2>
              {(props.invites ?? []).length === 0 ? (
                <p className={`${panelClass} p-8 text-center text-muted-foreground`}>
                  No invites have been issued yet. Approve a request to issue one.
                </p>
              ) : (
                <Table caption="Invites, newest first" headings={["Email", "Status", "Issued", "Expires", "Action"]}>
                  {(props.invites ?? []).map((invite) => {
                    const status = inviteStatus(invite);
                    return (
                      <tr key={invite.id} className="even:bg-muted">
                        <td className={`${td} break-all font-mono text-xs`}>{invite.email}</td>
                        <td className={td}><Badge>{status}</Badge></td>
                        <td className={`${td} font-mono text-xs`}>{formatDate(invite.createdAt)}</td>
                        <td className={`${td} font-mono text-xs`}>{formatDate(invite.expiresAt)}</td>
                        <td className={td}>
                          {status === "active" && <RevokeInviteButton id={invite.id} email={invite.email} />}
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </section>
          )}

          {tab === "accounts" && (
            <section aria-labelledby="accounts-heading">
              <h2 id="accounts-heading" className="sr-only">Accounts</h2>
              <Table caption="Accounts, newest first" headings={["Name", "Email", "Joined", "Links", "Action"]}>
                {(props.accounts ?? []).map((account) => (
                  <tr key={account.id} className="even:bg-muted">
                    <td className={`${td} font-semibold`}>
                      {account.name} {isAdmin(account.email) && <Badge>admin</Badge>}
                    </td>
                    <td className={`${td} break-all font-mono text-xs`}>{account.email}</td>
                    <td className={`${td} font-mono text-xs`}>{formatDate(account.createdAt)}</td>
                    <td className={`${td} font-mono text-xs`}>{account.linkCount}</td>
                    <td className={td}>
                      {!isAdmin(account.email) && <DeleteAccountButton id={account.id} email={account.email} />}
                    </td>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {tab === "links" && (
            <div className="flex flex-col gap-10">
              <section aria-labelledby="links-heading">
                <h2 id="links-heading" className="sr-only">Links</h2>
                {(props.links ?? []).length === 0 ? (
                  <p className={`${panelClass} p-8 text-center text-muted-foreground`}>No links yet.</p>
                ) : (
                  <Table
                    caption="All links, newest first"
                    headings={["Link", "Destination", "Owner", "Scans", "Safety check", "Status", "Action"]}
                  >
                    {(props.links ?? []).map((link) => (
                      <tr key={link.id} className="even:bg-muted">
                        <td className={`${td} font-mono text-xs font-bold`}>/{link.slug}</td>
                        <td className={`${td} max-w-64 truncate font-mono text-xs`} title={link.destinationUrl}>
                          {link.destinationUrl}
                        </td>
                        <td className={`${td} break-all font-mono text-xs`}>{link.ownerEmail}</td>
                        <td className={`${td} font-mono text-xs`}>{link.scanCount}</td>
                        <td className={td}><Badge>{link.urlCheck}</Badge></td>
                        <td className={td}>
                          <Badge>{link.status}</Badge>
                          {link.disabledReason && (
                            <p className="mt-1 max-w-48 text-xs text-muted-foreground">{link.disabledReason}</p>
                          )}
                        </td>
                        <td className={td}>
                          <LinkActions id={link.id} slug={link.slug} status={link.status} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </section>

              <section aria-labelledby="blocked-heading" className={`${panelClass} flex flex-col gap-4 p-5 sm:p-6`}>
                <h2 id="blocked-heading" className="text-xl font-bold">Blocked websites</h2>
                <p className="text-sm text-muted-foreground">
                  No link can point at a blocked website or any of its subdomains.
                  Blocking one also disables every link already pointing there.
                </p>
                <BlockedHostsPanel hosts={props.blockedHosts ?? []} />
              </section>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
