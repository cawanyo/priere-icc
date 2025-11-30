"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  /** * Texte optionnel à afficher sous le spinner 
   */
  message?: string;
  
  /** * Si true, couvre tout l'écran (fixed). Sinon, couvre le parent (absolute).
   * Note: Le parent doit avoir 'relative' ou 'absolute' si fullScreen est false.
   */
  fullScreen?: boolean;
  
  className?: string;
}

export function LoadingOverlay({ message, fullScreen = false, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in",
        fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-inherit", // rounded-inherit permet de suivre les bords arrondis du parent
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        {message && (
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}