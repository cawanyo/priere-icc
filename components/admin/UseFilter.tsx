"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
      params.set("page", "1"); // Retour page 1 si filtre change
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
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm mb-6">
      
      {/* Barre de Recherche */}
      <div className="flex w-full sm:max-w-md items-center space-x-2">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
                type="text" 
                placeholder="Rechercher par nom ou email..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-gray-50"
            />
        </div>
        <Button size="sm" onClick={handleSearch} className="bg-indigo-900 hover:bg-indigo-800">
            Rechercher
        </Button>
      </div>

      {/* Filtre Rôle */}
      <div className="w-full sm:w-[220px]">
        <Select 
            onValueChange={(val) => updateFilter("role", val)} 
            defaultValue={searchParams.get("role") || "ALL"}
        >
          <SelectTrigger className="bg-gray-50">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            <SelectItem value="REQUESTER">Utilisateur (Requester)</SelectItem>
            <SelectItem value="PRAYER_LEADER">Conducteur</SelectItem>
            <SelectItem value="INTERCESSOR">Intercesseur</SelectItem>
            <SelectItem value="LEADER">Leader</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={resetFilters} className="px-3 text-red-600 hover:bg-red-50 ml-auto sm:ml-0">
          <X className="h-4 w-4 mr-2" /> Effacer
        </Button>
      )}
    </div>
  );
}