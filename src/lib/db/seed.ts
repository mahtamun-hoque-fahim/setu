import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { issueInviteForEmail } from "@/lib/invites";

/**
 * Dev-only seed. Never run this against a database with real users in it.
 * Creates the sign-up through Better Auth's own API rather than inserting
 * a row directly, so the password hash is one Better Auth can actually
 * verify against later. Sign-up is invite-only, so it issues itself an
 * invite first, exactly as the admin dashboard would.
 */
async function seed() {
  const email = "fahim@example.com";
  const password = "change-this-before-real-use-123";

  const db = getDb();
  const { code } = await issueInviteForEmail(db, email);

  const signUp = await auth.api.signUpEmail({
    // inviteCode is read by the invite check, it is not part of the typed body.
    body: { email, name: "Fahim", password, inviteCode: code } as {
      email: string;
      name: string;
      password: string;
    },
  });

  await db.insert(links).values({
    id: newId(),
    slug: "mahtamun",
    destinationUrl: "https://facebook.com/yourpage",
    ownerId: signUp.user.id,
  });

  console.log(`Seeded user ${email} (password: ${password}) and one link at /mahtamun`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
