import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { LucideIcon } from "lucide-react"

export interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: LucideIcon
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, startIcon: StartIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {StartIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <StartIcon className="size-4" />
          </div>
        )}
        <Input
          className={cn(
            StartIcon && "pl-10", // Espace pour l'icône de gauche
            className
          )}
          ref={ref}
          {...props}
        />
      
      </div>
    )
  }
)
IconInput.displayName = "IconInput"

export { IconInput }