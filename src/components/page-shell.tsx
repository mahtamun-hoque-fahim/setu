import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Props = {
  username?: string;
  showSignIn?: boolean;
  children: React.ReactNode;
};

/** Header, a skip link, the page content and the footer, shared by every page. */
export function PageShell({ username, showSignIn, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:border-2 focus-visible:border-border focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader username={username} showSignIn={showSignIn} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
