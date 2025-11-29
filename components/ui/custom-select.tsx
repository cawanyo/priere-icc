"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormControl } from "@/components/ui/form"
import { cn } from "@/lib/utils"

// Type pour des options flexibles (soit "Valeur", soit { value: "val", label: "Libellé" })
export type SelectOption = string | { value: string; label: string }

interface CustomSelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionnez une option",
  className,
  disabled,
}: CustomSelectProps) {
  
  // Normalisation des options pour gérer les deux formats (string ou objet)
  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt }
      }
      return opt
    })
  }, [options])

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <FormControl>
        <SelectTrigger className={cn("w-full h-11", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {normalizedOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}