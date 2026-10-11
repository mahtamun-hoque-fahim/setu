import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { buttonPrimary, panelClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Setu exists, how it works, and who built it. A QR code should take people straight to where you sent them.",
};

const promises = [
  {
    title: "Your own slug.",
    body: "Pick the words after the slash, like /mahtamun, instead of a random code.",
  },
  {
    title: "Codes you can fix.",
    body: "Change where a link points and the same printed QR code lands on the new destination. Every change is written to an edit history, so nothing is swapped silently.",
  },
  {
    title: "Analytics that are yours.",
    body: "Country, device, browser, referrer and time for each scan, visible only to you, along with the destination each scan was sent to.",
  },
];

const maker = [
  { label: "Name", value: "Mahtamun Hoque Fahim" },
  { label: "What I do", value: "Student, developer and designer" },
  { label: "Based in", value: "Chattogram, Bangladesh" },
  { label: "Designing since", value: "2016" },
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-8 md:py-16 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <h1 className="text-4xl sm:text-5xl">Why I built Setu</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed">
            Setu is a QR code and short-link service built on one promise: when
            someone scans your code, they go straight to the place you sent
            them.
          </p>

          <div className="mt-4 max-w-2xl space-y-5 text-base leading-relaxed">
            <h2 className="pt-8 text-2xl">It started with an ID card</h2>
            <p>
              I wanted a QR code on my ID card that opened my startup&apos;s
              Facebook page. That should be the easy part of any project.
            </p>
            <p>
              The free QR generators I found did something else. A scan did not
              go to my page. It went through the generator&apos;s own website
              first, with ads and the generator&apos;s logo, and only after that
              reached the page I had chosen.
            </p>
            <p>
              A QR code is a small, honest contract: one scan, one destination.
              Those tools broke it. The person scanning loses time and trust,
              and the person who printed the code takes the blame.
            </p>

            <h2 className="pt-8 text-2xl">What Setu does about it</h2>
            <p>
              Setu answers every scan with a redirect and nothing else. The scan
              is recorded right after the redirect has been sent, so analytics
              never slow anyone down.
            </p>
            <ul className="space-y-4 border-2 border-border bg-muted p-5 shadow-hard-3">
              {promises.map((promise) => (
                <li key={promise.title}>
                  <span className="font-bold">{promise.title}</span>{" "}
                  {promise.body}
                </li>
              ))}
            </ul>

            <h2 className="pt-8 text-2xl">What Setu does not do</h2>
            <p>
              No ads. No watermark. No page between the scan and the
              destination. The redirect carries no scripts and sets no tracking
              cookies.
            </p>

            <h2 className="pt-8 text-2xl">The name</h2>
            <p>
              Setu (<span lang="bn" className="font-bengali">সেতু</span>) is the
              Bengali word for bridge. A QR code is a bridge between paper and a
              screen. A bridge should get you across, not stop you to collect a
              toll.
            </p>

            <h2 className="pt-8 text-2xl">Who built it</h2>
            <p>
              I am Mahtamun Hoque Fahim. I study computer science and
              engineering at BGC Trust University Bangladesh, and I design and
              build software on my own from Chattogram. I have been designing
              since 2016, and Setu is one of several products I am building.
              There is no team and no co-founder behind it, just me.
            </p>
            <p>
              If something on Setu is broken, or you have an idea for it, I
              would like to hear it.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/dashboard" className={buttonPrimary}>
              Try Setu
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary"
            >
              Back to home
            </Link>
          </div>
        </article>

        <aside className="lg:col-span-4" aria-labelledby="maker-heading">
          <div className={`${panelClass} p-6 lg:sticky lg:top-8`}>
            <h2 id="maker-heading" className="text-2xl">
              Made by Mahtamun
            </h2>
            <dl className="mt-5 divide-y-2 divide-border border-y-2 border-border">
              {maker.map((item) => (
                <div key={item.label} className="py-3">
                  <dt className="text-sm text-muted-foreground">{item.label}</dt>
                  <dd className="mt-0.5 font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-5 space-y-1 font-mono text-sm">
              <li>
                <a
                  href="https://github.com/mahtamun-hoque-fahim"
                  className="inline-flex min-h-11 items-center font-semibold text-primary underline decoration-2 underline-offset-4"
                >
                  github.com/mahtamun-hoque-fahim
                </a>
              </li>
              <li>
                <a
                  href="https://mahtamunhoquefahim.vercel.app"
                  className="inline-flex min-h-11 items-center font-semibold text-primary underline decoration-2 underline-offset-4"
                >
                  mahtamunhoquefahim.vercel.app
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
