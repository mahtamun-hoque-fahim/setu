-- Setu: edit history and per-scan destination snapshot.
-- Additive and safe to re-run. Old app code keeps working after this runs.

-- 1. Remember where each scan was sent (null for scans from before this change).
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "destination_url" text;

-- 2. One row per real destination change.
CREATE TABLE IF NOT EXISTS "link_edits" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text NOT NULL,
  "edited_by" text NOT NULL,
  "previous_url" text NOT NULL,
  "new_url" text NOT NULL,
  "edited_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "link_edits"
    ADD CONSTRAINT "link_edits_link_id_links_id_fk"
    FOREIGN KEY ("link_id") REFERENCES "public"."links"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "link_edits"
    ADD CONSTRAINT "link_edits_edited_by_user_id_fk"
    FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "link_edits_link_id_edited_at_idx"
  ON "link_edits" USING btree ("link_id", "edited_at");

-- 3. Backfill existing scans. Accurate only because no link has ever been
-- edited yet, so every past scan really was sent to the link's current
-- destination. Run this BEFORE anyone edits a link; the "IS NULL" guard
-- makes it safe to re-run.
UPDATE "scans" s
SET "destination_url" = l."destination_url"
FROM "links" l
WHERE s."link_id" = l."id" AND s."destination_url" IS NULL;
