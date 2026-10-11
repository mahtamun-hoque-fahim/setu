import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { panelClass } from "@/components/ui";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 md:py-24">
        <div className={`${panelClass} p-8 text-center md:p-10`}>
          <div className="mx-auto mb-6 h-0.5 w-12 bg-foreground" aria-hidden="true" />
          <h1 className="text-2xl md:text-3xl">This bridge does not exist</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Check the link and try again. If you scanned a QR code, ask whoever
            made it to confirm the address.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center gap-2 font-mono font-medium text-primary hover:underline hover:decoration-2 hover:underline-offset-4"
          >
            Go to the home page
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
