"use client";

import { BookOpen, Volume2, Video, FileText, Search, Laptop } from "lucide-react";
import { Dock, type DockItem } from "@/components/ui/dock";

const PORTAL_DOCK_ITEMS: DockItem[] = [
  {
    id: "scripture",
    label: "Scriptures",
    icon: <BookOpen className="h-full w-full" />,
    href: "/scripture/quran",
    badge: "5",
  },
  {
    id: "audios",
    label: "Audio Archives",
    icon: <Volume2 className="h-full w-full" />,
    href: "/audios",
  },
  {
    id: "videos",
    label: "Video Lectures",
    icon: <Video className="h-full w-full" />,
    href: "/videos",
  },
  {
    id: "written",
    label: "Written Library",
    icon: <FileText className="h-full w-full" />,
    href: "/written",
    badge: "74",
  },
  {
    id: "search",
    label: "Universal Search",
    icon: <Search className="h-full w-full" />,
    href: "/search",
  },
  {
    id: "app",
    label: "SA Studio Desktop",
    icon: <Laptop className="h-full w-full" />,
    href: "/app",
  },
];

export function FloatingDock({ className = "" }: { className?: string }) {
  return (
    <aside aria-label="Quick Navigation Dock" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden sm:flex ${className}`}>
      <Dock items={PORTAL_DOCK_ITEMS} />
    </aside>
  );
}

export default FloatingDock;
