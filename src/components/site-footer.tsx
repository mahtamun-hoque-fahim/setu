import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          <span className="font-semibold">Setu</span>{" "}
          <span lang="bn" className="font-bengali">
            সেতু
          </span>
          <span aria-hidden="true"> · </span>
          The bridge between scan and destination
        </p>
        <nav aria-label="Footer" className="flex items-center gap-6">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center font-semibold hover:underline hover:decoration-2 hover:underline-offset-4"
          >
            About
          </Link>
          <span className="text-muted-foreground">
            © {new Date().getFullYear()} Setu
          </span>
        </nav>
      </div>
    </footer>
  );
}
