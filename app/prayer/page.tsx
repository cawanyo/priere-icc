import Image from "next/image";
import { PrayerRequestForm } from "./PrayerRequestForm";
import { checkUser } from "../actions/user";

export default async function PrayerPage() {

  const user = await checkUser();
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            "Approchons-nous donc avec assurance du trône de la grâce afin d'obtenir miséricorde et de trouver grâce, pour être secourus dans nos besoins." <br/>
            <span className="text-sm font-semibold text-primary">- Hébreux 4:16</span>
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Image latérale (visible sur Desktop) */}
          <div className="hidden md:block w-1/3 relative bg-primary/10">
             <Image
                src="/assets/images/prayer.png" 
                alt="Mains en prière"
                fill
                className="object-cover opacity-90"
             />
             <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
          </div>

          {/* Zone du formulaire */}
          <div className="w-full md:w-2/3 p-8 md:p-12">
            <PrayerRequestForm user={user?? undefined}/>
          </div>
        </div>
      </div>
    </div>
  );
}