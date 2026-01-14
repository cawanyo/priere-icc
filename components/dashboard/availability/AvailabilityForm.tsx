"use client";

import { useState } from "react";
import { addUnavailability } from "@/app/actions/availability";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { fr } from "date-fns/locale";
import { format } from "date-fns";

export function AvailabilityForm() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date?.from) {
      toast.error("Veuillez sélectionner une date ou une période.");
      return;
    }
    setLoading(true);
    const res = await addUnavailability({ dateRange: {from: format(date.from, "yyyy-MM-dd"), to :date.to ? format(date.to, "yyyy-MM-dd") : undefined } , reason });
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
      setReason("");
      setDate(undefined);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="border-none shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-serif text-indigo-900 flex items-center gap-2">
          <CalendarPlus className="h-5 w-5" />
          Ajouter une indisponibilité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col space-y-2">
            <Label>Période d'absence</Label>
            <div className="border rounded-md p-2 flex justify-center bg-white">
              <Calendar
                mode="range"
                selected={date}
                onSelect={setDate}
                locale={fr}
                numberOfMonths={1}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Désactiver le passé
                className="rounded-md"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Cliquez sur une date (ou deux pour une plage).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motif (Optionnel)</Label>
            <Input 
                id="reason" 
                placeholder="Ex: Vacances, Travail..." 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white"
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-900 hover:bg-indigo-800" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}