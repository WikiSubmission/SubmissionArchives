"use client";

import { useState, type ReactNode, type FC, useId } from "react";
import { motion } from "motion/react";

export interface FluidTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number | string;
}

export interface FluidTabsProps {
  tabs: FluidTabItem[];
  activeId?: string;
  defaultActive?: string;
  onChange?: (id: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs,
  activeId,
  defaultActive = tabs[0]?.id,
  onChange,
  className = "",
  size = "md",
}) => {
  const [internalActive, setInternalActive] = useState<string>(defaultActive);
  const active = activeId ?? internalActive;
  const layoutId = useId();

  const handleSelect = (id: string) => {
    setInternalActive(id);
    onChange?.(id);
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 min-h-[30px]",
    md: "px-3.5 py-1.5 text-xs sm:text-[0.8rem] gap-2 min-h-[36px]",
    lg: "px-4 py-2 text-sm gap-2.5 min-h-[42px]",
  };

  return (
    <div
      role="tablist"
      className={`relative inline-flex items-center gap-1 rounded-full border border-ed-rule bg-ed-surface/90 p-1 shadow-sm backdrop-blur-md dark:border-ed-rule-strong dark:bg-ed-surface/70 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id)}
            className={`relative z-10 flex cursor-pointer select-none items-center font-mono font-medium uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
              sizeClasses[size]
            } ${
              isActive
                ? "font-bold text-ed-bg"
                : "text-ed-fg-muted hover:text-ed-fg"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={`fluid-tabs-active-${layoutId}`}
                transition={{
                  duration: 0.24,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-0 z-[-1] rounded-full bg-ed-fg shadow-sm"
              />
            )}

            {tab.icon && (
              <span className="shrink-0 transition-transform duration-200">
                {tab.icon}
              </span>
            )}

            <span className="truncate">{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[0.65rem] transition-colors ${
                  isActive
                    ? "bg-ed-bg/20 text-ed-bg"
                    : "bg-ed-surface-strong text-ed-fg-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FluidTabs;
