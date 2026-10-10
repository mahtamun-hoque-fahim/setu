"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/login");
      }}
      className="min-h-11 px-1 text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-primary"
    >
      Sign out
    </button>
  );
}
