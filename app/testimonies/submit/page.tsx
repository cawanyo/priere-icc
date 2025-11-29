import { TestimonyForm } from "@/components/testimonies/TestimonyForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SubmitTestimonyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        
        <Link href="/testimonies" className="flex items-center text-sm text-gray-500 hover:text-indigo-900 transition-colors w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux témoignages
        </Link>

        <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif font-bold text-indigo-900">Racontez votre histoire</h1>
            <p className="text-gray-600">
                "Ils l'ont vaincu à cause du sang de l'agneau et à cause de la parole de leur témoignage."
                <br /><span className="text-sm font-medium text-pink-600">- Apocalypse 12:11</span>
            </p>
        </div>

        <TestimonyForm />
      </div>
    </div>
  );
}