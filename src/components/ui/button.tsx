import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors";
    const styles: Record<NonNullable<Props["variant"]>, string> = {
      default:
        "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black",
      outline:
        "border border-neutral-300 bg-transparent hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900",
      ghost: "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${styles[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
