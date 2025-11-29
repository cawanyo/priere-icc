import * as React from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css" // Import des styles de base
import { cn } from "@/lib/utils"

// Props personnalisées si besoin
interface CustomPhoneInputProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  className?: string
  placeholder?: string
  error?: boolean
}

const PhoneInputCustom = React.forwardRef<HTMLInputElement, CustomPhoneInputProps>(
  ({ className, value, onChange, placeholder, error, ...props }, ref) => {
    return (
      <div className={cn("flex", className)}>
        <PhoneInput
          international
          defaultCountry="FR"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
            "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring", // Effet de focus
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-within:ring-destructive", // Gestion de l'erreur
            // Styles spécifiques pour l'input interne de la librairie
            "[&_input]:h-full [&_input]:w-full [&_input]:bg-transparent [&_input]:outline-none [&_input]:placeholder:text-muted-foreground",
            // Styles pour le drapeau
            "[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center"
          )}
          {...props}
        />
      </div>
    )
  }
)

PhoneInputCustom.displayName = "PhoneInputCustom"

export { PhoneInputCustom }