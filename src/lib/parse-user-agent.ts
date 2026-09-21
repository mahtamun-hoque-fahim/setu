/**
 * Deliberately minimal. Good enough to show "iPhone, Safari" instead of a
 * raw user-agent string in a dashboard table, not meant to be a precise
 * device-detection library.
 */
export function parseUserAgent(ua: string | null): {
  device: string;
  browser: string;
} {
  if (!ua) return { device: "Unknown", browser: "Unknown" };

  const device = /iphone/i.test(ua)
    ? "iPhone"
    : /ipad/i.test(ua)
      ? "iPad"
      : /android/i.test(ua)
        ? "Android"
        : /macintosh/i.test(ua)
          ? "Mac"
          : /windows/i.test(ua)
            ? "Windows"
            : /linux/i.test(ua)
              ? "Linux"
              : "Unknown";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /crios\//i.test(ua)
        ? "Chrome"
        : /fxios\//i.test(ua)
          ? "Firefox"
          : /firefox\//i.test(ua)
            ? "Firefox"
            : /safari\//i.test(ua)
              ? "Safari"
              : "Unknown";

  return { device, browser };
}
