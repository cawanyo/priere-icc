"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Trash, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { getTeamMembers } from "@/app/actions/team"; // On réutilise cette action !
import { ScrollArea } from "@/components/ui/scroll-area";

interface IntercessorSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function IntercessorSelector({ selectedIds, onChange }: IntercessorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    // Charger les membres au montage
    getTeamMembers().then(res => {
        if(res.success) setMembers(res.data?? []);
    });
  }, []);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedMembers = members.filter(m => selectedIds.includes(m.id));

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Sélectionner des intercesseurs...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 pointer-events-auto">
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList >
                <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea>
                    {members.map((member) => (
                        <CommandItem
                        key={member.id}
                        value={member.name}
                        onSelect={() => toggleSelection(member.id)}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            selectedIds.includes(member.id) ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {member.name}
                        </CommandItem>
                    ))} 
                </ScrollArea>
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Affichage des tags sélectionnés */}
      <div className="flex flex-wrap gap-2">
        {selectedMembers.map(member => (
            <Badge key={member.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {member.name}
                 
                <div className=" inline" onClick={() => toggleSelection(member.id)}>
                 <X size={13} className="text-red-400 hover:cursor-pointer hover:text-red-500 ml-3" />
                </div>
                

            </Badge>
        ))}
      </div>
    </div>
  );
}