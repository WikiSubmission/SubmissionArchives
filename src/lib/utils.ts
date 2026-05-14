import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaHref(mediaId: string): string {
  const segments = mediaId
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  return `/media/${segments.join("/")}`;
}
