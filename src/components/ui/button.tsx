import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Botones de ESTACIONARTE: petróleo para el paso principal, coral sólo para cobrar o pagar.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border font-semibold transition-[background,box-shadow,transform] outline-none active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-on-brand hover:bg-brand-strong",
        pay: "border-transparent bg-coral text-on-coral shadow-coral hover:brightness-95",
        outline: "border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken",
        ghost: "border-transparent bg-transparent text-brand-strong hover:bg-brand-soft",
        destructive: "border-transparent bg-danger-soft text-danger hover:brightness-95",
      },
      size: {
        default: "h-11 rounded-[16px] px-5 text-[15px] leading-5",
        sm: "h-9 rounded-[10px] px-3 text-sm",
        icon: "size-9 rounded-[10px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
