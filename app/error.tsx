"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-9 w-9 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Une erreur est survenue</h1>
        <p className="text-gray-500 text-sm mb-8">
          Quelque chose s'est mal passé. Vous pouvez réessayer ou retourner au tableau de bord.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
          </Button>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
