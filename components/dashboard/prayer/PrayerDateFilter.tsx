"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PrayerDateFilter({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialisation de l'état avec les params URL
  const initialDate: DateRange | undefined = 
    searchParams.get("startDate") 
      ? {
          from: new Date(searchParams.get("startDate")!),
          to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
        }
      : undefined;

  const [date, setDate] = React.useState<DateRange | undefined>(initialDate);

  // Mise à jour de l'URL lors de la sélection
  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    const params = new URLSearchParams(searchParams.toString());

    if (newDate?.from) {
      params.set("startDate", format(newDate.from, "yyyy-MM-dd"));
      if (newDate.to) {
        params.set("endDate", format(newDate.to, "yyyy-MM-dd"));
      } else {
        params.delete("endDate"); // Si une seule date sélectionnée
      }
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    
    router.push(`?${params.toString()}`);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect(undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM", { locale: fr })} -{" "}
                  {format(date.to, "dd MMM", { locale: fr })}
                </>
              ) : (
                format(date.from, "dd MMMM yyyy", { locale: fr })
              )
            ) : (
              <span>Filtrer par date</span>
            )}
            {date?.from && (
                <div 
                    onClick={clearDate} 
                    className="ml-auto hover:bg-slate-200 rounded-full p-1 transition-colors"
                >
                    <X className="h-3 w-3 text-muted-foreground" />
                </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}