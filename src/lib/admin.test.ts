import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin";

describe("isAdminEmail", () => {
  it("matches the configured admin, ignoring case and spaces", () => {
    expect(isAdminEmail("Admin@Example.com", " admin@example.COM ")).toBe(true);
  });
  it("rejects everyone else", () => {
    expect(isAdminEmail("friend@example.com", "admin@example.com")).toBe(false);
  });
  it("nobody is admin when ADMIN_EMAIL is not set, or is blank", () => {
    expect(isAdminEmail("admin@example.com", undefined)).toBe(false);
    expect(isAdminEmail("admin@example.com", "   ")).toBe(false);
  });
  it("rejects a missing email", () => {
    expect(isAdminEmail(undefined, "admin@example.com")).toBe(false);
    expect(isAdminEmail(null, "admin@example.com")).toBe(false);
    expect(isAdminEmail("", "")).toBe(false);
  });
  it("does not treat a partial match as the admin", () => {
    expect(isAdminEmail("admin@example.com.evil.io", "admin@example.com")).toBe(false);
    expect(isAdminEmail("xadmin@example.com", "admin@example.com")).toBe(false);
  });
});
