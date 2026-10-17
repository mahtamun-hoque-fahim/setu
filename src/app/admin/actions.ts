"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteAccountAndData } from "@/lib/account-deletion";
import { approveRequest, rejectRequest, revokeInvite } from "@/lib/invites";
import {
  addBlockedHost,
  disableLink,
  enableLink,
  removeBlockedHost,
} from "@/lib/link-moderation";
import { publicBaseUrl } from "@/lib/public-url";

/**
 * Every admin mutation. Each one starts with requireAdmin(), because a
 * server action is a public endpoint that anyone can call by hand, whether
 * or not the admin page ever rendered a button for it.
 */

export type ApprovalResult =
  | { ok: true; email: string; joinUrl: string; expiresAt: string }
  | { ok: false; error: string };

export async function approveRequestAction(requestId: string): Promise<ApprovalResult> {
  await requireAdmin();
  const result = await approveRequest(getDb(), requestId);
  if (!result.ok) return result;

  revalidatePath("/admin");
  // The email and the code travel in the URL fragment, which browsers never
  // send to a server, so neither ends up in anyone's request logs.
  const fragment = new URLSearchParams({ email: result.email, code: result.code });
  return {
    ok: true,
    email: result.email,
    joinUrl: `${publicBaseUrl()}/join#${fragment.toString()}`,
    expiresAt: result.expiresAt.toISOString(),
  };
}

export async function rejectRequestAction(requestId: string) {
  await requireAdmin();
  await rejectRequest(getDb(), requestId);
  revalidatePath("/admin");
}

export async function revokeInviteAction(inviteId: string) {
  await requireAdmin();
  await revokeInvite(getDb(), inviteId);
  revalidatePath("/admin");
}

export async function disableLinkAction(linkId: string, reason: string) {
  await requireAdmin();
  await disableLink(getDb(), linkId, reason.trim().slice(0, 200) || null);
  revalidatePath("/admin");
}

export async function enableLinkAction(linkId: string) {
  await requireAdmin();
  await enableLink(getDb(), linkId);
  revalidatePath("/admin");
}

export async function addBlockedHostAction(
  host: string,
  reason: string,
): Promise<{ ok: true; host: string; disabled: number } | { ok: false; error: string }> {
  await requireAdmin();
  const result = await addBlockedHost(getDb(), host, reason.trim().slice(0, 200) || null);
  revalidatePath("/admin");
  return result;
}

export async function removeBlockedHostAction(host: string) {
  await requireAdmin();
  await removeBlockedHost(getDb(), host);
  revalidatePath("/admin");
}

export async function deleteAccountAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const result = await deleteAccountAndData(getDb(), userId, {
    adminEmail: process.env.ADMIN_EMAIL,
  });
  revalidatePath("/admin");
  return result;
}
