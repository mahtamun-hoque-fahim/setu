import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestDb } from "@/test/db";
import { invites, user } from "@/lib/db/schema";
import { issueInviteForEmail } from "@/lib/invites";

process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

import { createAuth } from "@/lib/auth-factory";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let db: TestDb;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  ctx = await createTestDb();
  db = ctx.db;
  auth = createAuth(db);
});
afterAll(async () => {
  await ctx.client.close();
});
beforeEach(async () => {
  await db.delete(invites);
  await db.delete(user);
});

// Goes through the same HTTP handler the browser uses, so this proves that a
// direct POST to the endpoint, with the sign-up form never involved, is
// locked too.
function post(path: string, body: unknown) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify(body),
    }),
  );
}
const signUp = (body: Record<string, unknown>) =>
  post("/sign-up/email", { name: "Rafi", password: "correct-horse-battery", ...body });

const users = () => db.select().from(user);

describe("sign-up is invite-only", () => {
  it("refuses a sign-up with no invite code, and creates no account", async () => {
    const res = await signUp({ email: "rafi@example.com" });
    expect(res.status).toBe(403);
    expect((await res.json()).message).toMatch(/invite/i);
    expect(await users()).toHaveLength(0);
  });

  it("refuses an invite code for a different email", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    const res = await signUp({ email: "someone-else@example.com", inviteCode: code });
    expect(res.status).toBe(403);
    expect(await users()).toHaveLength(0);
  });

  it("refuses a wrong code", async () => {
    await issueInviteForEmail(db, "rafi@example.com");
    const res = await signUp({ email: "rafi@example.com", inviteCode: "AAAA-AAAA-AAAA-AAAA" });
    expect(res.status).toBe(403);
    expect(await users()).toHaveLength(0);
  });

  it("refuses an expired invite", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    await db.update(invites).set({ expiresAt: new Date(Date.now() - 1000) });
    const res = await signUp({ email: "rafi@example.com", inviteCode: code });
    expect(res.status).toBe(403);
  });

  it("creates the account for the right email with the right code, and spends the invite", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    const res = await signUp({ email: "Rafi@Example.com", inviteCode: code });
    expect(res.status).toBe(200);

    const [created] = await users();
    expect(created.email).toBe("rafi@example.com");
    const [invite] = await db.select().from(invites);
    expect(invite.usedAt).not.toBeNull();
    expect(invite.usedBy).toBe(created.id);
  });

  it("does not let a spent code create a second account", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    expect((await signUp({ email: "rafi@example.com", inviteCode: code })).status).toBe(200);
    const again = await signUp({ email: "rafi@example.com", inviteCode: code });
    expect(again.status).not.toBe(200);
    expect(await users()).toHaveLength(1);
  });
});

describe("existing accounts are not affected", () => {
  it("signs in with email and password and gets a session cookie, no invite needed", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    await signUp({ email: "rafi@example.com", inviteCode: code });

    const res = await post("/sign-in/email", {
      email: "rafi@example.com",
      password: "correct-horse-battery",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/session_token/);
  });

  it("rejects a wrong password as before", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    await signUp({ email: "rafi@example.com", inviteCode: code });
    const res = await post("/sign-in/email", { email: "rafi@example.com", password: "wrong-password-123" });
    expect(res.status).toBe(401);
  });
});

describe("the invite code is never stored on the user", () => {
  it("keeps only a hash in the invites table", async () => {
    const { code } = await issueInviteForEmail(db, "rafi@example.com");
    await signUp({ email: "rafi@example.com", inviteCode: code });
    const [created] = await users();
    expect(JSON.stringify(created)).not.toContain(code);
    const [invite] = await db.select().from(invites).where(eq(invites.email, "rafi@example.com"));
    expect(JSON.stringify(invite)).not.toContain(code);
  });
});
