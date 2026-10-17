import { getDb } from "@/lib/db";
import { createAccessRequest } from "@/lib/invites";

// A request is a name, an email and a short note. Anything near this size is
// not a person filling in the form.
const MAX_BODY_BYTES = 10_000;

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return new Response("That request is too large", { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Send a JSON body", { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return new Response("Send a JSON body", { status: 400 });
  }

  const result = await createAccessRequest(getDb(), body as Record<string, unknown>);

  if (result.status === "invalid") {
    return new Response(result.error, { status: 400 });
  }
  if (result.status === "closed") {
    return new Response("Requests are paused for now, please try again later", {
      status: 503,
    });
  }
  return Response.json({ status: "received" });
}
