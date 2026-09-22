"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
      className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-surface-elevated hover:text-text active:scale-[0.97]"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </button>
  );
}
