// components/dashboard/prayer/PrayerFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PrayerDateFilter } from "./PrayerDateFilter"; // Nouvel import
import { useState } from "react";

export function PrayerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("search", searchValue);
  };

  const resetFilters = () => {
    setSearchValue("");
    router.push("?");
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
      
      {/* Ligne 1 : Recherche + Dates */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex w-full sm:max-w-sm items-center space-x-2">
            <Input 
                type="text" 
                placeholder="Rechercher (nom, contenu...)" 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="icon" variant="ghost" onClick={handleSearch}>
                <Search className="h-4 w-4" />
            </Button>
        </div>
        
        {/* Filtre Date */}
        <PrayerDateFilter />
      </div>

      {/* Ligne 2 : Sélecteurs + Reset */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
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

        {/* Bouton Reset */}
        {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="px-3 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto sm:ml-0">
            <X className="h-4 w-4 mr-2" /> Tout effacer
            </Button>
        )}
      </div>
    </div>
  );
}