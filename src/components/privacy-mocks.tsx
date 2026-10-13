import { panelClass } from "@/components/ui";

/**
 * Static, illustrative pictures of two real screens, so the privacy page can
 * show exactly what is recorded and who can see it. Sample data, nothing here
 * is read from the database.
 */

const sampleScans = [
  { time: "2 minutes ago", device: "iPhone, Safari", country: "Bangladesh", referrer: "Direct", sentTo: "https://facebook.com/yourpage" },
  { time: "18 minutes ago", device: "Windows, Chrome", country: "India", referrer: "facebook.com", sentTo: "https://facebook.com/yourpage" },
];

const th = "px-3 py-2 text-xs font-semibold uppercase tracking-wider";
const td = "px-3 py-2 align-top";

export function ScanRecordMock() {
  return (
    <figure aria-label="Example of the scans table an account holder sees, with sample data">
      <div className={`${panelClass} p-4`}>
        <p className="font-bold">Scans of your link</p>
        <div
          role="region"
          aria-label="Example scans table, scrolls sideways on small screens"
          tabIndex={0}
          className="mt-3 overflow-x-auto border-2 border-border"
        >
          <table className="w-full min-w-xl border-collapse text-left text-xs">
            <thead>
              <tr className="bg-foreground text-background">
                {["Time", "Device", "Country", "Referrer", "Sent to"].map((h) => (
                  <th key={h} scope="col" className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {sampleScans.map((scan) => (
                <tr key={scan.time} className="even:bg-muted">
                  <td className={`${td} font-mono`}>{scan.time}</td>
                  <td className={td}>{scan.device}</td>
                  <td className={td}>{scan.country}</td>
                  <td className={td}>{scan.referrer}</td>
                  <td className={`${td} font-mono`}>{scan.sentTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        Sample data. Those five columns are everything recorded about a scan.
      </figcaption>
    </figure>
  );
}

const sampleAdminLinks = [
  { link: "/portfolio", owner: "friend@example.com", scans: "842", status: "active" },
  { link: "/menu", owner: "other@example.com", scans: "63", status: "active" },
];

export function AdminViewMock() {
  return (
    <figure aria-label="Example of what the admin sees, with sample data">
      <div className={`${panelClass} p-4`}>
        <p className="font-bold">Admin: links</p>
        <div
          role="region"
          aria-label="Example admin links table, scrolls sideways on small screens"
          tabIndex={0}
          className="mt-3 overflow-x-auto border-2 border-border"
        >
          <table className="w-full min-w-md border-collapse text-left text-xs">
            <thead>
              <tr className="bg-foreground text-background">
                {["Link", "Owner", "Scans", "Status"].map((h) => (
                  <th key={h} scope="col" className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {sampleAdminLinks.map((row) => (
                <tr key={row.link} className="even:bg-muted">
                  <td className={`${td} font-mono`}>{row.link}</td>
                  <td className={`${td} font-mono`}>{row.owner}</td>
                  <td className={`${td} font-mono`}>{row.scans}</td>
                  <td className={td}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        Sample data. Scan counts only. The admin dashboard has no way to show an individual scan.
      </figcaption>
    </figure>
  );
}
