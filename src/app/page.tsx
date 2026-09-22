import { ArrowRight, ScanLine, Ban, ChartNoAxesColumn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <section className="hero-glow mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <span
          className="animate-fade-up font-mono text-sm tracking-wide text-text-faint"
          style={{ animationDelay: "0ms" }}
        >
          Setu / সেতু
        </span>
        <h1
          className="animate-fade-up mt-4 font-display text-4xl font-bold sm:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          The bridge, not the detour.
        </h1>
        <p
          className="animate-fade-up mt-6 max-w-xl text-lg text-text-muted"
          style={{ animationDelay: "120ms" }}
        >
          Setu turns a QR scan into a straight line. Instant redirect, full
          analytics, zero ads.
        </p>
        <a
          href="/dashboard"
          className="animate-fade-up mt-10 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97]"
          style={{ animationDelay: "180ms" }}
        >
          Get started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon={<ScanLine className="h-5 w-5 text-accent" aria-hidden="true" />}
            title="Scan, land"
            body="One request, one redirect. Nothing rendered in between."
            delay={240}
          />
          <Feature
            icon={<Ban className="h-5 w-5 text-accent" aria-hidden="true" />}
            title="No detour"
            body="No forced ads, no logo, no third-party page along the way."
            delay={290}
          />
          <Feature
            icon={
              <ChartNoAxesColumn className="h-5 w-5 text-accent" aria-hidden="true" />
            }
            title="Your data"
            body="Scan count, device, and location, kept in your own dashboard."
            delay={340}
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
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-lg border border-border bg-surface p-6 text-left transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow"
      style={{ animationDelay: `${delay}ms` }}
    >
      {icon}
      <h2 className="mt-3 font-display text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}
