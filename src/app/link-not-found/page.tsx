import { notFound } from "next/navigation";

/**
 * Where /[slug] sends scans of a slug that does not exist. Route handlers
 * cannot render the branded 404 page, but a page can: notFound() renders
 * app/not-found.tsx with a real 404 status.
 */
export default function LinkNotFound() {
  notFound();
}
