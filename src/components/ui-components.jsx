import React from "react";
import { cn } from "@/lib/utils";

// Button
export const Button = React.forwardRef(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-border bg-transparent hover:border-primary/50 hover:bg-primary/5 text-foreground",
      ghost: "bg-transparent hover:bg-secondary text-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    };
    
    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-11 px-6 font-medium rounded-xl",
      lg: "h-14 px-8 text-lg font-medium rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Input
export const Input = React.forwardRef(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-sm ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// Dialog/Modal minimal implementation
export function Dialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// Progress Bar
export function ProgressBar({ progress }) {
  return (
    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}