import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  StickyNote,
  Tags,
  Network,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
  { icon: Tags, label: "Tags", href: "/tags" },
  { icon: Network, label: "Network", href: "/network3d" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <motion.nav 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background/60 backdrop-blur-xl border border-border/10 rounded-full shadow-lg"
      >
        <div className="flex items-center px-4 h-16">
          <div className="flex justify-around gap-1 md:gap-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ 
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-300",
                      isActive 
                        ? "text-primary bg-muted/80 scale-110" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-1 text-[10px] font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}