import Link from "next/link";
import { ArrowRight, CornerDownRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { buttonPrimary } from "@/components/ui";

const facts = [
  {
    title: "One request, one redirect",
    body: "The redirect is sent first. No splash page, no script, no waiting while something loads in between.",
  },
  {
    title: "No ads, no logo",
    body: "The code is yours. There is no watermark on it and no page of ours between the scan and your destination.",
  },
  {
    title: "Your data stays in your dashboard",
    body: "Setu records country, device and referrer for each scan and shows them only to you. Visitors get no tracking cookies.",
  },
];

// Illustrative sample data. The QR pattern is decorative and not scannable.
const sampleScans = [
  { place: "Bangladesh", device: "Mobile", when: "3 minutes ago" },
  { place: "United States", device: "iPhone", when: "18 minutes ago" },
  { place: "Australia", device: "Desktop", when: "42 minutes ago" },
];

export default function Home() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <section className="border-b-2 border-border py-12 md:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <h1 className="text-4xl leading-[1.08] sm:text-5xl">
                The bridge between scans and destinations.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                A QR scan becomes a straight line to your destination. Instant
                redirect, private analytics, zero ads.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/dashboard" className={buttonPrimary}>
                  Get started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary"
                >
                  Why I built Setu
                </Link>
              </div>
            </div>

            <figure
              className="lg:col-span-7"
              aria-label="Example of a Setu link with sample data"
            >
              <div className="border-2 border-border bg-muted p-5 shadow-hard-4 sm:p-7">
                <div className="flex items-center justify-between gap-3 border-b-2 border-border pb-4">
                  <p className="font-mono text-sm font-bold">setu.app/mahtamun</p>
                  <p className="border-2 border-border bg-background px-2.5 py-1 font-mono text-xs font-semibold">
                    1,429 scans
                  </p>
                </div>

                <div className="mt-5 border-2 border-border bg-background p-5">
                  <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <div className="inline-block border-2 border-border bg-white p-3 shadow-hard-3">
                        <DecorativeQr />
                      </div>
                    </div>
                    <div className="sm:col-span-8">
                      <p className="border-2 border-border bg-muted px-3.5 py-2.5 font-mono text-sm font-bold text-primary">
                        setu.app/mahtamun
                      </p>
                      <div className="relative my-3 flex items-center py-2" aria-hidden="true">
                        <div className="h-0.5 w-full bg-foreground" />
                        <ArrowRight className="absolute right-0 size-5 bg-background" />
                      </div>
                      <p className="flex items-center gap-2 border-2 border-border bg-muted px-3.5 py-2.5 font-mono text-sm">
                        <CornerDownRight className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">https://facebook.com/yourpage</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-2 border-border bg-background p-4">
                  <h2 className="border-b-2 border-border pb-3 text-sm font-bold">
                    Recent scans
                  </h2>
                  <ul className="divide-y divide-foreground/20 font-mono text-xs">
                    {sampleScans.map((scan) => (
                      <li
                        key={scan.place}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span>
                          <span className="font-bold">{scan.place}</span>
                          <span className="text-muted-foreground"> / {scan.device}</span>
                        </span>
                        <span className="text-muted-foreground">{scan.when}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                Sample data for illustration.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="py-14 md:py-20" aria-label="What Setu promises">
          <ul className="grid grid-cols-1 divide-y-2 divide-border border-2 border-border shadow-hard-4 md:grid-cols-3 md:divide-x-2 md:divide-y-0">
            {facts.map((fact) => (
              <li key={fact.title} className="p-7">
                <h2 className="text-xl">{fact.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {fact.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

function DecorativeQr() {
  return (
    <svg
      className="size-28 text-foreground"
      viewBox="0 0 120 120"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 10h30v30h-30zM15 15v20h20v-20zM20 20h10v10h-10z" />
      <path d="M80 10h30v30h-30zM85 15v20h20v-20zM90 20h10v10h-10z" />
      <path d="M10 80h30v30h-30zM15 85v20h20v-20zM20 90h10v10h-10z" />
      <path d="M45 15h5v5h-5zM55 15h5v5h-5zM65 15h5v5h-5zM15 45h5v5h-5zM15 55h5v5h-5zM15 65h5v5h-5z" />
      <path d="M45 45h8v8h-8zM60 45h6v6h-6zM72 45h6v12h-6zM45 60h6v6h-6zM54 57h6v6h-6zM63 60h9v6h-9z" />
      <path d="M45 75h12v6h-12zM63 72h6v12h-6zM75 66h9v6h-9zM87 45h6v9h-6zM99 48h6v6h-6zM90 60h15v6h-15z" />
      <path d="M45 90h6v15h-6zM57 93h12v6h-12zM75 84h6v9h-6zM87 75h6v6h-6zM96 75h9v15h-9zM72 102h18v6h-18z" />
    </svg>
  );
}
