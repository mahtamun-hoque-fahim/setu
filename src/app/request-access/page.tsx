import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { RequestAccessForm } from "@/components/request-access-form";

export const metadata: Metadata = {
  title: "Request an invite",
  description: "Setu is invite-only. Ask for an invite and I will get back to you if we know each other.",
};

export default function RequestAccessPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl">Request an invite</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Setu is invite-only for now. I approve people I know, so tell me who
          you are and how we know each other.
        </p>
        <div className="mt-8">
          <RequestAccessForm />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an invite code?{" "}
          <Link href="/join" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Join Setu
          </Link>
          . Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Sign in
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
