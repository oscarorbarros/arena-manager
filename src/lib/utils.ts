import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGoogleDriveUrl(url: string | undefined | null) {
  if (!url || typeof url !== 'string') return url || '';
  if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
          return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
  }
  return url;
}
