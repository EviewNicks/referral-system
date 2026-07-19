import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[8px] border-2 border-[#E5E7EB] bg-white px-3 py-2 text-sm transition-colors outline-none placeholder:text-[#9CA3AF] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-[#CAFF04] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
