"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react"; // Search n'était pas utilisé
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  image?: string | null;
}

interface SearchableUserSelectProps {
  users: User[];
  onSelect: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableUserSelect({ 
  users, 
  onSelect, 
  placeholder = "Rechercher un membre...",
  className 
}: SearchableUserSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");

  // On trouve l'utilisateur sélectionné pour l'affichage du bouton
  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Fonction simplifiée qui prend directement l'ID
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    onSelect(userId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-white border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900", className)}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
                 <Avatar className="h-5 w-5">
                    <AvatarImage src={selectedUser.image || ""} />
                    <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                        {selectedUser.name[0]}
                    </AvatarFallback>
                 </Avatar>
                 <span className="truncate">{selectedUser.name}</span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Taper un nom..." />
          <CommandList>
            <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
            <CommandGroup max-height="200px" className="overflow-y-auto">
              {users.map((user) => (
                <CommandItem
                  key={user.id}                
                  value={`${user.name}-${user.id}`} 
                  onSelect={() => handleSelectUser(user.id)}
                  
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserId === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span>{user.name}</span>
                        {/* Optionnel : Afficher l'ID ou email en petit pour distinguer visuellement */}
                        {/* <span className="text-[9px] text-gray-400">#{user.id.slice(-4)}</span> */}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}