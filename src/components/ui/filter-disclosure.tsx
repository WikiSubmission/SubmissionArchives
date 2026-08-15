"use client";

import { useState, type FC, type ComponentType } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FaBell, FaTasks } from "react-icons/fa";
import { IoCalendar } from "react-icons/io5";
import { BsCheckLg, BsFillPeopleFill, BsPinFill } from "react-icons/bs";
import { RiBubbleChartFill } from "react-icons/ri";
import { PiFunnelSimpleBold } from "react-icons/pi";
import type { IconType } from "react-icons";

export interface FilterItem {
  id: string;
  label: string;
  icon: IconType | ComponentType<{ className?: string }>;
}

export interface FilterDisclosureProps {
  items?: FilterItem[];
  defaultActiveId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

const SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 20,
  mass: 1,
} as const;

export const DEFAULT_FILTER_ITEMS: FilterItem[] = [
  { id: "tasks", label: "Tasks", icon: FaTasks },
  { id: "events", label: "Events", icon: IoCalendar },
  { id: "reminders", label: "Reminders", icon: FaBell },
  { id: "appointments", label: "Appointment", icon: BsPinFill },
  { id: "meetings", label: "Meetings", icon: BsFillPeopleFill },
  { id: "celebrations", label: "Celebrations", icon: RiBubbleChartFill },
];

export const FilterDisclosure: FC<FilterDisclosureProps> = ({
  items = DEFAULT_FILTER_ITEMS,
  defaultActiveId = "reminders",
  activeId,
  onChange,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [internalActive, setInternalActive] = useState(defaultActiveId);
  const active = activeId ?? internalActive;

  const activeItem = items.find((i) => i.id === active) ?? items[0];
  const ActiveIcon = activeItem ? activeItem.icon : FaTasks;

  const handleSelect = (id: string) => {
    setInternalActive(id);
    onChange?.(id);
    setTimeout(() => setOpen(false), 220);
  };

  return (
    <div className={`relative flex h-[70px] w-[300px] items-center justify-center ${className}`}>
      <MotionConfig
        transition={{
          type: "spring",
          bounce: 0.25,
          duration: 0.7,
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="open"
              layoutId="filter-disclosure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0 },
              }}
              style={{ transformOrigin: "50% 100%", borderRadius: 32 }}
              className="absolute z-30 flex w-[300px] flex-col gap-[4px] overflow-hidden rounded-3xl border border-ed-rule bg-ed-surface/95 p-[8px] shadow-[0_16px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl will-change-transform dark:border-ed-rule-strong dark:bg-ed-surface-strong/95 dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            >
              {items.map((item, index) => {
                const Icon = item.icon;
                const selected = active === item.id;

                return (
                  <motion.button
                    type="button"
                    key={item.id}
                    initial={{ opacity: 0, scale: 1.1, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    onClick={() => handleSelect(item.id)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ ...SPRING, delay: (3 + index) * 0.05 }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-[16px] px-[12px] py-[10px] transition-colors hover:bg-ed-bg/80 active:bg-ed-bg"
                  >
                    <div className="flex items-center gap-[24px]">
                      <Icon className="h-[22px] w-[22px] text-ed-fg-muted transition-colors group-hover:text-ed-fg" />
                      <span className="text-[17px] font-bold tracking-tight text-ed-fg">
                        {item.label}
                      </span>
                    </div>

                    <motion.div
                      animate={{
                        backgroundColor: selected ? "#f59e0b" : "rgba(0,0,0,0)",
                        borderColor: selected ? "#f59e0b" : "var(--ed-rule-strong, rgba(0,0,0,0.2))",
                      }}
                      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[2.5px] transition-colors"
                    >
                      <motion.div
                        animate={{
                          scale: selected ? 1 : 0,
                          opacity: selected ? 1 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 520,
                          damping: 30,
                        }}
                      >
                        <BsCheckLg className="h-[14px] w-[14px] text-white" />
                      </motion.div>
                    </motion.div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <div key="close" className="flex items-center">
              <motion.button
                type="button"
                layoutId="filter-disclosure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0 },
                }}
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  borderRadius: 32,
                }}
                aria-label="Open filter menu"
                className="z-20 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border border-ed-rule bg-ed-surface shadow-md will-change-transform hover:border-ed-rule-strong hover:bg-ed-surface-strong active:scale-95 dark:border-ed-rule-strong dark:bg-ed-surface"
              >
                <PiFunnelSimpleBold className="h-[28px] w-[28px] text-ed-fg" />
              </motion.button>

              <motion.div
                initial={{ x: -30 }}
                animate={{ x: 0 }}
                transition={{
                  type: "spring",
                  bounce: 0,
                  duration: 1.2,
                }}
                className="z-10 -ml-[12px] flex h-[60px] w-[60px] items-center justify-center rounded-full border border-ed-rule bg-ed-surface/90 opacity-90 shadow-sm backdrop-blur-md dark:border-ed-rule-strong dark:bg-ed-surface/90"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    <ActiveIcon className="h-[22px] w-[22px] text-amber-500 dark:text-amber-400" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
};
export default FilterDisclosure;
