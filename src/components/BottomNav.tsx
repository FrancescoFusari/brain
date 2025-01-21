import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  StickyNote,
  Tags,
  Network,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
  { icon: Tags, label: "Tags", href: "/tags" },
  { icon: Network, label: "Network", href: "/network3d" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <nav className="bg-background/95 backdrop-blur-lg border border-border/10 rounded-full shadow-lg">
        <div className="flex items-center px-4 h-16">
          <div className="flex justify-around gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-200",
                    isActive 
                      ? "text-primary bg-muted" 
                      : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-1 text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}