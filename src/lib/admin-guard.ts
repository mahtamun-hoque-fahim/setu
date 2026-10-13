import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

/** The signed-in admin, or null for everyone else, including signed-out visitors. */
export async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session.user.email)) return null;
  return session;
}

/**
 * Call first in every admin page and every admin server action. Server
 * actions are public HTTP endpoints, so each one checks for itself.
 * Non-admins get a plain 404, the same as a page that does not exist.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) notFound();
  return session;
}
