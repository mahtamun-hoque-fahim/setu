// WARDEN-DRAFT: written from the code's data map and src/content/legal.ts. Fahim reviews it, resolves the CONFIRM notes there, then deletes this line.
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AdminViewMock, ScanRecordMock } from "@/components/privacy-mocks";
import { panelClass } from "@/components/ui";
import { dataUses, operator, policyUpdated, processors, purpose } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Setu stores, why, who can see it, and how to have it deleted. Setu is a research and learning project run by one person.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8 md:py-16">
        <h1 className="text-4xl sm:text-5xl">Privacy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Updated{" "}
          <time dateTime={policyUpdated}>
            {new Date(policyUpdated).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}
          </time>
        </p>

        <p className="mt-8 text-xl leading-relaxed">{purpose}</p>

        <div className="mt-4 space-y-5 text-base leading-relaxed">
          <h2 className="pt-8 text-2xl">Who runs Setu</h2>
          <p>
            {operator.name}, {operator.place}. For anything about your data,
            email{" "}
            <a href={`mailto:${operator.email}`} className="font-semibold text-primary underline underline-offset-2">
              {operator.email}
            </a>
            . I reply within one month.
          </p>

          <h2 className="pt-8 text-2xl">What Setu stores, and why</h2>
          <ul className="space-y-4">
            {dataUses.map((use) => (
              <li key={use.what} className={`${panelClass} p-5`}>
                <h3 className="text-base font-bold">{use.what}</h3>
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
                  <dt className="text-muted-foreground">Why</dt>
                  <dd>{use.why}</dd>
                  <dt className="text-muted-foreground">Basis</dt>
                  <dd>{use.basis}</dd>
                  <dt className="text-muted-foreground">Kept</dt>
                  <dd>{use.kept}</dd>
                </dl>
              </li>
            ))}
          </ul>

          <h2 className="pt-8 text-2xl">What an account holder sees</h2>
          <p>
            Your dashboard shows each scan of your links. This is the whole
            record.
          </p>
          <ScanRecordMock />

          <h2 className="pt-8 text-2xl">What I see as the admin</h2>
          <p>
            I can see requests, accounts, links with their destinations and
            owners, and how many scans each link has. I can disable a link or
            block a website to stop abuse. The dashboard cannot show an
            individual scan. I run the database, so I could technically read
            it directly, and I will not do that to look at who scanned what.{/* CONFIRM: this is a promise made in your name */}
          </p>
          <AdminViewMock />

          <h2 className="pt-8 text-2xl">Who else handles it</h2>
          <ul className="list-disc space-y-2 pl-5">
            {processors.map((processor) => (
              <li key={processor.name}>
                <strong className="font-semibold">{processor.name}</strong>:{" "}
                {processor.purpose}.{processor.where ? ` Data stored in ${processor.where}.` : ""}
              </li>
            ))}
          </ul>

          <h2 className="pt-8 text-2xl">Cookies</h2>
          <p>
            Setu sets one cookie, a session cookie, and only when you sign in.
            People who scan a code, and visitors to the public pages, get no
            cookie. There is no tracking, no advertising and no analytics
            script.
          </p>

          <h2 className="pt-8 text-2xl">Deleting your data</h2>
          <p>
            Email me and I will delete your account, your links, every scan
            record of those links, your edit history, your sessions and your
            invite request. If you scanned a code and want a record about you
            removed, tell me which link and I will remove it.
          </p>

          <h2 className="pt-8 text-2xl">Children</h2>
          <p>
            Setu is not meant for children. Invites go only to people I know.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
