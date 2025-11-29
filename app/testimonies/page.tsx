import { getPublicTestimonies } from "@/app/actions/testimony";
import { TestimonyCard } from "@/components/testimonies/TestimonyCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quote } from "lucide-react";

export default async function TestimoniesPage() {
  const { data: testimonies } = await getPublicTestimonies();

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-indigo-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
                <Quote className="h-6 w-6 text-pink-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                Ils ont vu la main de Dieu
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                Découvrez les histoires inspirantes de notre communauté. La prière change les choses, et ces vies en sont la preuve vivante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-full px-8">
                    <Link href="/testimonies/submit">Partager mon histoire</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-900 rounded-full px-8 bg-transparent">
                    <Link href="/prayer">Déposer une requête</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Liste des témoignages */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        {testimonies && testimonies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonies.map((t) => (
                    <TestimonyCard key={t.id} testimony={t} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
                <p className="text-gray-500 text-lg">Aucun témoignage publié pour le moment.</p>
                <p className="text-sm text-gray-400">Soyez le premier à témoigner !</p>
            </div>
        )}
      </section>
    </div>
  );
}