/**
 * Who the admin is: the one email in ADMIN_EMAIL. Nothing is stored in the
 * database, so there is no role column to tamper with. The check always
 * runs on the server, a hidden link or a hidden button is never protection.
 */
export function isAdminEmail(
  email: string | null | undefined,
  adminEmail: string | null | undefined,
): boolean {
  const admin = adminEmail?.trim().toLowerCase();
  const candidate = email?.trim().toLowerCase();
  return Boolean(admin) && Boolean(candidate) && candidate === admin;
}

export function isAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email, process.env.ADMIN_EMAIL);
}
