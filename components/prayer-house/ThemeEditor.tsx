"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

interface ThemeEditorProps {
  initialValue?: string | null;
  onSave: (val: string) => Promise<any>;
  placeholder?: string;
  type?: "week" | "day"; // Pour le style
}

export function ThemeEditor({ initialValue, onSave, placeholder, type = "day" }: ThemeEditorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(value);
    setLoading(false);
    setOpen(false);
    toast.success("Thème mis à jour");
  };

  // Style différent selon si c'est Semaine ou Jour
  if (type === "week") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto w-full  p-2 text-left hover:bg-indigo-50 group border border-dashed border-transparent hover:border-indigo-200">
          <div className="flex flex-col items-start text-sm md:text-lg w-full">
            <span className="font-bold text-indigo-400 uppercase tracking-wider mb-1 flex-1 whitespace-normal wrap-break-word text-left">
                Thème de la semaine
            </span>
            
            {/* Ajout de w-full ici pour occuper la largeur */}
            <div className="flex items-center gap-2 text-indigo-900 font-serif font-medium w-full">
                
                <MessageSquareQuote className="h-4 w-4 text-indigo-400 shrink-0" />
                
                {/* Le span enveloppe le texte pour gérer le retour à la ligne */}
                <span className="flex-1 whitespace-normal wrap-break-word text-left">
                    {initialValue || <span className="text-gray-400 italic text-sm">Ajouter un thème...</span>}
                </span>
                
                {/* shrink-0 ici aussi */}
                <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
        </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-screen sm:w-80 ">
            <h4 className="font-medium mb-2 text-sm">Modifier le thème de la semaine</h4>
            <Input 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                placeholder={placeholder}
                className="mb-2"
            />
            <Button size="sm" onClick={handleSave} disabled={loading} className="w-full bg-indigo-900">
                Enregistrer
            </Button>
        </PopoverContent>
      </Popover>
    );
  }

  // Style "Day" (plus compact pour l'en-tête du tableau)
  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto w-full  p-2 text-left hover:bg-indigo-50 group border border-dashed border-transparent hover:border-indigo-200">
          <div className="flex flex-col items-start text-[10px] w-full">
            <span className="font-bold text-indigo-400 uppercase tracking-wider mb-1 flex-1 whitespace-normal wrap-break-word text-left">
                Thème du jour
            </span>
            
            {/* Ajout de w-full ici pour occuper la largeur */}
            <div className="flex items-center gap-2 text-indigo-900 font-serif  font-medium w-full">
                
                  <MessageSquareQuote className="h-4 w-4 text-indigo-400 shrink-0" />
                  
                  {/* Le span enveloppe le texte pour gérer le retour à la ligne */}
                  <span className="flex-1 whitespace-normal wrap-break-word text-left">
                      {initialValue || <span className="text-gray-400 italic ">Ajouter un thème...</span>}
                  </span>
                  
                  {/* shrink-0 ici aussi */}
                  <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
          </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full md:w-60 p-2">
            <Input 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                placeholder="Thème du jour..."
                className="h-8 text-xs mb-2"
            />
            <Button size="sm" onClick={handleSave} disabled={loading} className="w-full h-7 text-xs bg-indigo-600">
                OK
            </Button>
        </PopoverContent>
    </Popover>
  );
}