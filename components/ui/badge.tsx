import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[6px] border px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "border-[#2E4EEA] bg-[#2E4EEA]/10 text-[#2E4EEA]",
        secondary: "border-[#E5E7EB] bg-secondary text-secondary-foreground",
        destructive: "border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]",
        outline: "border-[#E5E7EB] text-[#374151]",
        music: "border-[#2E4EEA] bg-[#2E4EEA]/10 text-[#2E4EEA]",
        sport: "border-[#FFBC05] bg-[#FFBC05]/10 text-[#7a5a00]",
        religi: "border-[#6B7280] bg-[#CAFF04]/20 text-[#374151]",
        art: "border-[#DF135C] bg-[#DF135C]/10 text-[#DF135C]",
        seminar: "border-[#6D05FF] bg-[#6D05FF]/10 text-[#6D05FF]",
        komunitas: "border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
