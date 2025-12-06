"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PrayerDateFilter } from "./PrayerDateFilter"; 
// Vous devrez aussi adapter PrayerDateFilter pour accepter des props si vous voulez filtrer par date sans URL
// Pour l'instant, supposons qu'on passe la date via onFilterChange aussi

export interface FilterState {
  status: string;
  type: string;
  search: string;
  startDate?: string;
  endDate?: string;
  dateOrder: 'asc' | 'desc';
}

interface PrayerFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

export function PrayerFilters({ filters, onFilterChange }: PrayerFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce pour la recherche
  useEffect(() => {
    if (searchValue !== filters.search) {
        setIsSearching(true);
        const timer = setTimeout(() => {
            onFilterChange({ ...filters, search: searchValue, page: 1 } as any); // Reset page au changement
            setIsSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [searchValue, filters, onFilterChange]);

  const handleSelectChange = (key: keyof FilterState, value: string) => {
    const val = value === "ALL" ? "" : value;
    onFilterChange({ ...filters, [key]: val, page: 1 } as any); // Reset page
  };

  const handleDateChange = (range: { from?: Date, to?: Date } | undefined) => {
     // Logique d'adaptation pour PrayerDateFilter si nécessaire
     // Ici je simplifie l'appel pour l'exemple
  };

  const resetFilters = () => {
    setSearchValue("");
    onFilterChange({
        status: "",
        type: "",
        search: "",
        startDate: undefined,
        endDate: undefined,
        dateOrder: "desc"
    });
  };

  const hasActiveFilters = !!filters.status || !!filters.type || !!filters.search;

  return (
    <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
      
      {/* Ligne 1 : Recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex w-full sm:max-w-sm items-center space-x-2">
            <div className="relative flex-1">
                 <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>
                <Input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9 bg-gray-50"
                />
            </div>
        </div>
      </div>

      {/* Ligne 2 : Sélecteurs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-[200px]">
            <Select 
                value={filters.type || "ALL"} 
                onValueChange={(val) => handleSelectChange("type", val)}
            >
            <SelectTrigger><SelectValue placeholder="Sujet" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Tous les sujets</SelectItem>
                <SelectItem value="Famille">Famille</SelectItem>
                <SelectItem value="Santé">Santé</SelectItem>
                <SelectItem value="Travail">Travail</SelectItem>
                
                {/* ... autres */}
            </SelectContent>
            </Select>
        </div>

        <div className="w-full sm:w-[200px]">
            <Select 
                value={filters.status || "ALL"} 
                onValueChange={(val) => handleSelectChange("status", val)}
            >
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ANSWER">Exaucé</SelectItem>
            </SelectContent>
            </Select>
        </div>

        {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="px-3 text-red-500 ml-auto sm:ml-0">
            <X className="h-4 w-4 mr-2" /> Effacer
            </Button>
        )}
      </div>
    </div>
  );
}