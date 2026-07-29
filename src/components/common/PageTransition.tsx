import { motion } from 'framer-motion'
import { useNavigationType } from 'react-router-dom'
import { ReactNode } from 'react'

const variants = {
  forward: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  },
  backward: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 60 },
  },
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const navType = useNavigationType()
  const dir = navType === 'POP' ? 'backward' : 'forward'
  const v = variants[dir]

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
