import { getDb } from "@/lib/db";
import { createAuth } from "@/lib/auth-factory";

export const auth = createAuth(getDb());
