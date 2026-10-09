import {
  pgTable,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Better Auth core tables ---
// Table names are singular ("user", not "users") because Better Auth's
// Drizzle adapter expects these exact names by default.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Setu domain tables ---

export const links = pgTable(
  "links",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    destinationUrl: text("destination_url").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("links_slug_idx").on(table.slug),
  }),
);

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  linkId: text("link_id")
    .notNull()
    .references(() => links.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  userAgent: text("user_agent"),
  country: text("country"),
  referrer: text("referrer"),
  // The destination this scan was actually sent to. Snapshotted at scan time
  // because the owner can edit a link's destination later. Null on scans
  // recorded before this column existed.
  destinationUrl: text("destination_url"),
});

export const linkEdits = pgTable(
  "link_edits",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    editedBy: text("edited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    previousUrl: text("previous_url").notNull(),
    newUrl: text("new_url").notNull(),
    editedAt: timestamp("edited_at").notNull().defaultNow(),
  },
  (table) => ({
    linkEditedIdx: index("link_edits_link_id_edited_at_idx").on(
      table.linkId,
      table.editedAt,
    ),
  }),
);

export const linksRelations = relations(links, ({ many, one }) => ({
  scans: many(scans),
  edits: many(linkEdits),
  owner: one(user, { fields: [links.ownerId], references: [user.id] }),
}));

export const scansRelations = relations(scans, ({ one }) => ({
  link: one(links, { fields: [scans.linkId], references: [links.id] }),
}));

export const linkEditsRelations = relations(linkEdits, ({ one }) => ({
  link: one(links, { fields: [linkEdits.linkId], references: [links.id] }),
  editor: one(user, { fields: [linkEdits.editedBy], references: [user.id] }),
}));
