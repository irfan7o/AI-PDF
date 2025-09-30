
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { asCircle?: boolean }
>(({ className, value, asCircle, ...props }, ref) => {
    if (asCircle) {
        const r = 45;
        const circ = 2 * Math.PI * r;
        const strokePct = ((100 - (value ?? 0)) * circ) / 100;
        return (
            <svg width="100" height="100" className="transform -rotate-90">
                <circle
                    stroke="hsl(var(--secondary))"
                    strokeWidth="10"
                    fill="transparent"
                    r={r}
                    cx="50"
                    cy="50"
                />
                <circle
                    stroke="hsl(var(--primary))"
                    strokeWidth="10"
                    strokeDasharray={circ}
                    strokeDashoffset={strokePct}
                    strokeLinecap="round"
                    fill="transparent"
                    r={r}
                    cx="50"
                    cy="50"
                    className="transition-all duration-300"
                />
            </svg>
        );
    }

  return (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

    