import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts any Google Drive sharing link into a direct image URL
 * that works in <img> tags on external sites.
 *
 * Supported input formats:
 *  - https://drive.google.com/file/d/FILE_ID/view
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID
 *  - https://drive.google.com/uc?export=view&id=FILE_ID
 *  - https://drive.google.com/uc?export=download&id=FILE_ID
 *
 * Output format:
 *  https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
 *
 * The thumbnail endpoint is the ONLY Drive URL that Google allows
 * to be embedded in <img> tags on external domains without CORS
 * blocks or virus-scan redirect pages.
 */
export function formatGoogleDriveUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return url || "";

  // Not a Drive URL — return as-is
  if (!url.includes("drive.google.com")) return url;

  let fileId: string | null = null;

  // Pattern: /file/d/ID
  const p1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (p1) fileId = p1[1];

  // Pattern: ?id=ID or &id=ID (covers open?id=, uc?id=, uc?export=view&id=)
  if (!fileId) {
    const p2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (p2) fileId = p2[1];
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }

  return url;
}
