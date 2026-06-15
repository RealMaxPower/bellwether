import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-700 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-ink-700 bg-paper text-ink-700 hover:bg-ink-700 hover:text-paper",
        primary:
          "border border-oxblood bg-oxblood text-paper hover:bg-ink-700 hover:border-ink-700",
        outline:
          "border border-ink-700 bg-transparent text-ink-700 hover:bg-ink-700 hover:text-paper",
        ghost:
          "border border-paper-edge bg-paper text-ink-400 hover:border-ink-700 hover:bg-ink-700 hover:text-paper",
        link:
          "border-0 px-0 normal-case tracking-normal text-accent-dark underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        default: "h-9 px-3.5 text-[11px]",
        lg: "h-11 px-6 text-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
