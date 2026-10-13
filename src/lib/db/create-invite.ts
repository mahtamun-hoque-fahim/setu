import { getDb } from "@/lib/db";
import { issueInviteForEmail } from "@/lib/invites";
import { publicBaseUrl } from "@/lib/public-url";

/**
 * Issues an invite from the terminal and prints the join link:
 *   npm run invite -- someone@example.com
 * Use it to create the very first account (your own admin email) on a fresh
 * database, before there is an admin dashboard to approve requests from.
 */
async function main() {
  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run invite -- someone@example.com");
    process.exit(1);
  }

  const invite = await issueInviteForEmail(getDb(), email);
  const fragment = new URLSearchParams({ email: invite.email, code: invite.code });

  console.log(`Invite for ${invite.email}, valid until ${invite.expiresAt.toUTCString()}`);
  console.log(`${publicBaseUrl()}/join#${fragment.toString()}`);
  console.log("The code is shown only now. Only a hash of it is stored.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
