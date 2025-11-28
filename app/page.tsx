
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function Home() {

  return (
    <>
        <section className="grid md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Left content */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-indigo-900 leading-tight mb-4">
            Bienvenue sur la plateforme du  <br className="hidden sm:inline" /> Ministère de la prière
            </h1>
            <p className="text-gray-700 mb-6 text-sm sm:text-base md:text-lg">
            Rejoignez-nous dans un espace bienveillant où vous pourrez partager vos demandes de prière, consulter les prières de la communauté et
            recevoir des notifications en temps opportun. Encourageons-nous mutuellement dans la foi et l'espérance.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-center md:justify-start gap-4">
              <Link href="/prayer">
                <Button className="text-xs sm:text-base bg-pink-500 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-600">
                  Soumettre un sujet
                </Button>
              </Link>
              <Link href="/presentation">
                <Button className="text-xs sm:text-base bg-blue-100 text-blue-800 px-6 py-2 rounded-lg hover:bg-blue-200">
                  Plus d'information 
                </Button>
              </Link>
            </div>
          </div>

          {/* Right image/illustration */}
          <div className="w-full flex justify-center">
            <img
              src="/assets/images/illustration.png"
              alt="Illustration of prayer platform"
              className="max-w-xs sm:max-w-md w-full"
            />
          </div>
        </section>
   
    </>
  );
}
