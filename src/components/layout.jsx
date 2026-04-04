import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListTodo, BarChart2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "All Habits", icon: ListTodo },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function Layout({ children }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 size={24} className="fill-primary text-white" />
          <span className="font-display font-bold text-lg text-foreground">HabitFlow</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-border z-50">
        <div className="p-6 flex items-center gap-3 text-primary">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground tracking-tight">HabitFlow</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around p-2 pb-safe z-50">
        {navItems.map((item) => {
           const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
           return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg min-w-[4rem] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
           );
        })}
      </nav>
    </div>
  );
}