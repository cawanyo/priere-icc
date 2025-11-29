// components/dashboard/prayer/PrayerFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function PrayerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fonction utilitaire pour mettre à jour un paramètre
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("?");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
      
      {/* Filtre par Type */}
      <div className="w-full sm:w-[200px]">
        <Select 
            onValueChange={(val) => updateFilter("type", val)} 
            defaultValue={searchParams.get("type") || "ALL"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type de sujet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les sujets</SelectItem>
            <SelectItem value="Famille">Famille</SelectItem>
            <SelectItem value="Santé">Santé</SelectItem>
            <SelectItem value="Travail">Travail</SelectItem>
            <SelectItem value="Finances">Finances</SelectItem>
            <SelectItem value="Spirituel">Spirituel</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtre par Statut */}
      <div className="w-full sm:w-[200px]">
        <Select 
            onValueChange={(val) => updateFilter("status", val)}
            defaultValue={searchParams.get("status") || "ALL"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="ANSWER">Exaucé</SelectItem>
            <SelectItem value="FAILED">Non exaucé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tri par Date */}
      <div className="w-full sm:w-[200px]">
        <Select 
            onValueChange={(val) => updateFilter("dateOrder", val)}
            defaultValue={searchParams.get("dateOrder") || "desc"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Trier par date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Plus récent</SelectItem>
            <SelectItem value="asc">Plus ancien</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bouton Reset */}
      {(searchParams.has("type") || searchParams.has("status")) && (
        <Button variant="ghost" onClick={resetFilters} className="px-3">
          <X className="h-4 w-4 mr-2" /> Effacer
        </Button>
      )}
    </div>
  );
}