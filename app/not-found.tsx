import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-9 w-9 text-indigo-400" />
        </div>
        <h1 className="text-6xl font-extrabold text-indigo-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Page introuvable</h2>
        <p className="text-gray-500 text-sm mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" /> Retour au tableau de bord
          </Link>
        </Button>
      </div>
    </div>
  );
}
