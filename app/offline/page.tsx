"use client";

import Link from "next/link";
import { WifiOff, RotateCw, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
        
        {/* Icône d'état */}
        <div className="relative mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-indigo-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
        </div>

        {/* Titre et Explications */}
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-indigo-950">
            Vous êtes hors ligne
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Votre appareil n&apos;est actuellement pas connecté à Internet. Vérifiez votre réseau Wi-Fi ou vos données mobiles.
          </p>
        </div>

        {/* Carte d'information */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            Mode Hors Ligne Activé
          </div>
          <p className="text-xs text-gray-600 leading-normal">
            Les pages et créneaux que vous avez déjà consultés restent accessibles en cache. La synchronisation reprendra dès le rétablissement du réseau.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleRetry}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-2 shadow-sm"
          >
            <RotateCw className="h-4 w-4" />
            Réessayer
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
