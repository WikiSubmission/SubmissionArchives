"use client";

import React, { useRef, useState, type FC, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";

export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string;
}

export interface DockProps {
  items: DockItem[];
  className?: string;
}

function DockIcon({
  item,
  mouseX,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [42, 58, 42]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 160,
    damping: 12,
  });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      className="relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl border border-ed-rule bg-ed-surface/95 text-ed-fg shadow-md backdrop-blur-xl transition-colors hover:border-ed-fg/40 hover:bg-ed-surface-strong dark:border-ed-rule-strong dark:bg-ed-surface"
    >
      {/* Tooltip Label */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: -45, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute -top-2 flex flex-col items-center whitespace-nowrap rounded-lg border border-ed-rule-strong bg-ed-surface-strong px-2.5 py-1 font-mono text-[0.68rem] font-bold text-ed-fg shadow-xl backdrop-blur-md"
        >
          <span>{item.label}</span>
          <div className="absolute -bottom-1 h-2 w-2 rotate-45 border-b border-r border-ed-rule-strong bg-ed-surface-strong" />
        </motion.div>
      )}

      <div className="flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">
        {item.icon}
      </div>

      {item.badge && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 font-mono text-[0.58rem] font-bold text-white shadow-sm">
          {item.badge}
        </span>
      )}
    </motion.div>
  );

  if (item.href) {
    return (
      <Link href={item.href} aria-label={item.label} className="outline-none">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      aria-label={item.label}
      className="outline-none bg-transparent border-0 p-0 cursor-pointer"
    >
      {content}
    </button>
  );
}

export const Dock: FC<DockProps> = ({ items, className = "" }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`relative inline-flex items-end gap-2.5 rounded-3xl border border-ed-rule-strong/80 bg-ed-surface/85 px-3.5 py-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-2xl dark:border-ed-rule-strong dark:bg-ed-surface/75 ${className}`}
    >
      {items.map((item) => (
        <DockIcon key={item.id} item={item} mouseX={mouseX} />
      ))}
    </motion.div>
  );
};

export default Dock;
