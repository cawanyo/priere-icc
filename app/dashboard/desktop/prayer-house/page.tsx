import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import { UserNightBoard } from "../../prayer-house/UserNightBoard";
import { Church } from "lucide-react";

export default async function DesktopPrayerHousePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center">
          <Church className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Maison de Prière</h1>
          <p className="text-xs text-gray-400">Sentinelles — 00h à 04h</p>
        </div>
      </div>
      <div className="px-8 py-6 max-w-4xl">
        <UserNightBoard />
      </div>
    </div>
  );
}
