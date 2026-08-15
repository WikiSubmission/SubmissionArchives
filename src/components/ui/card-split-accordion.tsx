'use client';

import React, { useState, type FC, type ReactNode } from 'react';
import { motion, MotionConfig, type Transition } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import useMeasure from 'react-use-measure';

export interface AccordionItemData {
  id: number | string;
  title: string;
  icon?: ReactNode;
  badge?: string;
  content: ReactNode;
}

interface AccordionItemProps {
  item: AccordionItemData;
  setOpenId: (id: number | string | null) => void;
  index: number;
  total: number;
  openIndex: number;
}

export interface CardSplitAccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: number | string | null;
  className?: string;
}

const springTransition: Transition = {
  duration: 0.26,
  ease: [0.16, 1, 0.3, 1],
};

const AccordionItem: FC<AccordionItemProps> = ({
  item,
  setOpenId,
  index,
  total,
  openIndex,
}) => {
  const [ref, bounds] = useMeasure();
  const isOpen = index === openIndex;

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const isBeforeOpen = index === openIndex - 1;
  const isAfterOpen = index === openIndex + 1;

  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst);

  const BORDER_WIDTH = '1px';
  const BORDER_STYLE = 'solid';
  const borderTopWidth =
    isFirst || isAfterOpen || isOpen ? BORDER_WIDTH : '0px';
  const borderBottomWidth =
    isLast || isBeforeOpen || isOpen ? BORDER_WIDTH : '0px';
  const borderLeftWidth = BORDER_WIDTH;
  const borderRightWidth = BORDER_WIDTH;

  let borderTopLeftRadius = 0;
  let borderTopRightRadius = 0;
  let borderBottomLeftRadius = 0;
  let borderBottomRightRadius = 0;

  if (isOpen || isAlone) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isBeforeOpen) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isAfterOpen) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isFirst) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isLast) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  }

  return (
    <MotionConfig transition={springTransition}>
      <motion.li layout className="list-none">
        <motion.div
          animate={{
            borderTopLeftRadius,
            borderTopRightRadius,
            borderBottomLeftRadius,
            borderBottomRightRadius,
          }}
          className={`overflow-hidden border border-ed-rule bg-ed-surface/90 backdrop-blur-md transition-colors duration-200 will-change-transform dark:border-ed-rule-strong dark:bg-ed-surface/80 ${
            isOpen ? 'border-amber-500/40 shadow-lg dark:border-amber-400/40' : 'hover:bg-ed-surface-strong/80'
          }`}
          style={{
            borderTopWidth,
            borderBottomWidth,
            borderLeftWidth,
            borderRightWidth,
            borderStyle: BORDER_STYLE,
            marginBlock: isOpen ? '10px' : '0px',
          }}
        >
          <button
            type="button"
            onClick={() => setOpenId(isOpen ? null : item.id)}
            aria-expanded={isOpen}
            className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left select-none sm:px-5 sm:py-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.icon ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ed-rule bg-ed-surface-strong text-ed-fg">
                  {item.icon}
                </span>
              ) : null}

              <span className="truncate font-sans text-sm font-bold text-ed-fg sm:text-base">
                {item.title}
              </span>

              {item.badge ? (
                <span className="hidden rounded-full border border-ed-rule bg-ed-surface-strong px-2 py-0.5 font-mono text-[0.62rem] font-bold text-ed-fg-muted sm:inline-block">
                  {item.badge}
                </span>
              ) : null}
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 text-ed-fg-muted"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: isOpen ? bounds.height : 0,
              opacity: isOpen ? 1 : 0,
            }}
            className="overflow-hidden will-change-transform"
          >
            <div ref={ref}>
              <div className="border-t border-ed-rule/60 px-4 pb-4 pt-3 text-xs leading-relaxed text-ed-fg-muted sm:px-5 sm:pb-5 sm:text-sm">
                {item.content}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.li>
    </MotionConfig>
  );
};

export const CardSplitAccordion: FC<CardSplitAccordionProps> = ({
  items,
  defaultOpenId = null,
  className = '',
}) => {
  const [openId, setOpenId] = useState<number | string | null>(defaultOpenId);

  const openIndex = items.findIndex((item) => item.id === openId);

  return (
    <div className={`w-full ${className}`}>
      <ul className="w-full space-y-0 p-0 m-0">
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            setOpenId={setOpenId}
            index={index}
            total={items.length}
            openIndex={openIndex}
          />
        ))}
      </ul>
    </div>
  );
};

export default CardSplitAccordion;
