import { motion, AnimatePresence, Transition, Variants } from 'framer-motion'

export const springConfig: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8
}

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 25
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 25
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 }
}

export const slideIn: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -10, opacity: 0 }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig
  }
}

export { motion, AnimatePresence }
