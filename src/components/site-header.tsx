import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

type Props = {
  /** Set on signed-in pages: shows the name and Sign out instead of About. */
  username?: string;
  /** The login page hides its own link. */
  showSignIn?: boolean;
};

export function SiteHeader({ username, showSignIn = true }: Props) {
  return (
    <header className="border-b-2 border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link
          href={username ? "/dashboard" : "/"}
          className="flex items-baseline gap-2"
          aria-label="Setu home"
        >
          <span className="font-heading text-2xl font-bold tracking-tight">
            Setu
          </span>
          <span lang="bn" className="font-bengali text-xl font-bold">
            সেতু
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-5">
          {username ? (
            <>
              <span
                className="hidden max-w-48 truncate border-2 border-border px-2.5 py-1 font-mono text-xs sm:inline-block"
                title={username}
              >
                {username}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center px-1 text-sm font-semibold hover:underline hover:decoration-2 hover:underline-offset-4"
              >
                About
              </Link>
              {showSignIn && (
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center px-1 text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary"
                >
                  Sign in
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
