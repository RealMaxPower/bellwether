import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border border-current px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        default: "text-ink-500",
        accent: "text-accent-dark",
        monetary: "text-policy-monetary",
        fiscal: "text-policy-fiscal",
        trade: "text-policy-trade",
        regulatory: "text-policy-regulatory",
        exogenous: "text-policy-exogenous",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
