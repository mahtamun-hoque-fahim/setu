-- Setu: invite-only access, abuse controls and link status.
-- Additive and safe to re-run. Old app code keeps working after this runs,
-- so run it BEFORE deploying the matching code.

-- 1. Link status and the destination safety check result.
--    Existing links become "active" and "unchecked" through the defaults.
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "disabled_reason" text;
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "disabled_at" timestamp;
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "url_check" text DEFAULT 'unchecked' NOT NULL;

-- 2. Requests for an invite. Emails are stored lowercase.
CREATE TABLE IF NOT EXISTS "invite_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "note" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "reviewed_at" timestamp
);

-- At most one pending request per email, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS "invite_requests_pending_email_idx"
  ON "invite_requests" USING btree ("email") WHERE "invite_requests"."status" = 'pending';

-- 3. Invites. Only a hash of the code is stored.
CREATE TABLE IF NOT EXISTS "invites" (
  "id" text PRIMARY KEY NOT NULL,
  "request_id" text,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "used_by" text,
  "revoked_at" timestamp
);

DO $$ BEGIN
  ALTER TABLE "invites"
    ADD CONSTRAINT "invites_request_id_invite_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "public"."invite_requests"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invites"
    ADD CONSTRAINT "invites_used_by_user_id_fk"
    FOREIGN KEY ("used_by") REFERENCES "public"."user"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "invites_email_idx" ON "invites" USING btree ("email");

-- 4. Websites nobody may point a link at.
CREATE TABLE IF NOT EXISTS "blocked_hosts" (
  "host" text PRIMARY KEY NOT NULL,
  "reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
