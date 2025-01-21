import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: { 
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    x: 0,
    scale: 1
  },
  exit: { 
    opacity: 0,
    x: 20,
    scale: 0.98
  },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};