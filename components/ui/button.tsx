"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Tip } from "@/components/ui/tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold outline-none ring-offset-background transition-token disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.15rem] [&_svg]:shrink-0 [&_svg]:stroke-[2.25] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground! shadow-token-md hover:bg-primary/90 active:translate-y-px",
        secondary:
          "border border-primary/15 bg-secondary text-secondary-foreground shadow-token-xs hover:-translate-y-px hover:bg-accent",
        outline:
          "border bg-card text-foreground shadow-token-xs hover:-translate-y-px hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground! shadow-token-sm hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-xl px-5",
        icon: "size-10",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, title, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const tip =
      title ||
      (typeof props["aria-label"] === "string" ? props["aria-label"] : undefined);
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={onClick}
        ref={ref}
        {...props}
      />
    );
    if (size === "icon" && tip) {
      return <Tip label={tip}>{button}</Tip>;
    }
    return button;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
