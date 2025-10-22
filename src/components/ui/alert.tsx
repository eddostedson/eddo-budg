// src/components/ui/alert.tsx
import * as React from "react";

/** Petite utilité pour concaténer des classes sans dépendances externes */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  /** "default" | "destructive" */
  variant?: "default" | "destructive";
};

export function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  const base =
    "relative w-full rounded-lg border p-4 text-sm transition-colors";
  const variants: Record<NonNullable<AlertProps["variant"]>, string> = {
    default: "bg-background text-foreground",
    destructive:
      "border-red-300/70 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  };

  return (
    <div role="alert" className={cn(base, variants[variant], className)} {...props} />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm opacity-90", className)} {...props} />
  );
}







