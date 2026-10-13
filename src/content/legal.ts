// One source for the privacy page and the footer. Everything here is derived
// from what the code actually stores (see PLANNER.md, DB Schema). Values
// marked CONFIRM are Fahim's to check before launch. Nothing is invented.

export const operator = {
  name: "Mahtamun Hoque Fahim", // CONFIRM: your legal name
  place: "Chattogram, Bangladesh", // CONFIRM: add a postal address here if you want one published
  email: "mahtamunhoquefahim@gmail.com", // CONFIRM: an inbox you read, this is published on the privacy page
};

export const policyUpdated = "2026-10-13"; // change whenever the content below changes

// CONFIRM: a stated purpose is a commitment. If the data is ever used for
// something else, this sentence becomes untrue and must change first.
export const purpose =
  "Setu is a research and learning project run by one person. The data below is used only to run the service and for aggregate analysis of how QR links are used. It is never sold and never used for advertising.";

export type DataUse = { what: string; why: string; basis: string; kept: string };

export const dataUses: DataUse[] = [
  {
    what: "Invite request: your name, email and an optional note",
    why: "To decide whether to send you an invite.",
    basis: "Your consent, given when you send the form.",
    kept: "Until you ask me to delete it.", // CONFIRM: there is no automatic deletion of old requests
  },
  {
    what: "Account: your name, email and password",
    why: "To run your account and sign you in. The password is stored only as a hash, so I cannot read it.",
    basis: "Your consent when you join, and it is needed to give you the service.",
    kept: "Until you ask me to delete the account.",
  },
  {
    what: "Your links: each slug, its destination, and every change of destination (old address, new address, time)",
    why: "To send scans to the right place, and so a changed destination always leaves a record.",
    basis: "Your consent, and it is needed to give you the service.",
    kept: "Until you or I delete the link or your account.",
  },
  {
    what: "Scans of your links: time, device and browser, country, referring site, and the destination the scan was sent to",
    why: "To show the link's owner how it is used. This is data about the people who scan, not about the account holder.",
    basis:
      "The legitimate interest of the link's owner and of Setu in giving owners their statistics. People who scan are not asked first, because Setu puts no page in the way, so I record only what is listed here. No IP address is stored with a scan. The country is worked out by the host from the connection.",
    kept: "As long as the link exists.",
  },
  {
    what: "Login sessions: your IP address, browser details and a session cookie",
    why: "To keep you signed in and to protect your account.",
    basis: "It is needed to give you the service.",
    kept: "A session lasts 7 days. The record is removed when you sign out or your account is deleted.", // CONFIRM: expired session rows are not purged automatically
  },
];

export type Processor = { name: string; purpose: string; where?: string };

export const processors: Processor[] = [
  {
    name: "Vercel",
    purpose: "Hosts Setu. Its request logs include IP addresses, kept as long as Vercel's plan keeps them",
    // where: CONFIRM the region
  },
  {
    name: "Neon",
    purpose: "Stores the database",
    // where: CONFIRM the region
  },
  {
    name: "Google Safe Browsing",
    purpose:
      "When a link is saved, its destination address is sent to Google to check it against known unsafe sites. Nothing about you is sent. This runs only while a Safe Browsing key is set", // CONFIRM: true only if SAFE_BROWSING_API_KEY is set in production
  },
];
