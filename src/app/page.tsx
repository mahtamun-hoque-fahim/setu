import { ArrowRight, ScanLine, Ban, ChartNoAxesColumn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <span className="font-mono text-sm tracking-wide text-text-faint">
          Setu / সেতু
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-6xl">
          The bridge, not the detour.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-text-muted">
          Setu turns a QR scan into a straight line. Instant redirect, full
          analytics, zero ads.
        </p>
        <a
          href="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-semibold text-bg transition-colors hover:bg-accent-hover"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </a>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon={<ScanLine className="h-5 w-5 text-accent" />}
            title="Scan, land"
            body="One request, one redirect. Nothing rendered in between."
          />
          <Feature
            icon={<Ban className="h-5 w-5 text-accent" />}
            title="No detour"
            body="No forced ads, no logo, no third-party page along the way."
          />
          <Feature
            icon={<ChartNoAxesColumn className="h-5 w-5 text-accent" />}
            title="Your data"
            body="Scan count, device, and location, kept in your own dashboard."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 text-left">
      {icon}
      <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}
