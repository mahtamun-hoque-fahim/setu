import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "@/lib/db/types";
import * as schema from "@/lib/db/schema";
import { attachInviteUser, claimInvite } from "@/lib/invites";

export const INVITE_REQUIRED_MESSAGE =
  "Setu is invite-only. Use the invite code you were sent, with the email it was sent to.";

/**
 * Builds the auth instance for a given database. A factory so tests can run
 * the real thing against an in-process Postgres. The app itself uses the
 * instance exported from auth.ts.
 */
export function createAuth(db: Db) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh once per day
    },
    databaseHooks: {
      user: {
        create: {
          // The one place every account gets created, so the lock cannot be
          // bypassed by posting straight to /api/auth/sign-up/email. No code,
          // a wrong code, or a code for another email means no account.
          before: async (newUser, context) => {
            const inviteCode = (context?.body as { inviteCode?: unknown } | undefined)
              ?.inviteCode;
            const allowed = await claimInvite(db, {
              email: newUser.email,
              code: inviteCode,
            });
            if (!allowed) {
              throw new APIError("FORBIDDEN", { message: INVITE_REQUIRED_MESSAGE });
            }
          },
          after: async (createdUser) => {
            await attachInviteUser(db, createdUser.email, createdUser.id);
          },
        },
      },
    },
  });
}
