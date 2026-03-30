import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import { UserNightBoard } from "../../prayer-house/UserNightBoard";
import { Church } from "lucide-react";

export default async function MobilePrayerHousePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="px-4 pt-4 pb-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
            <Church className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-indigo-900">Maison de Prière</h1>
            <p className="text-xs text-muted-foreground">Sentinelles — 00h à 04h</p>
          </div>
        </div>

        <UserNightBoard />
      </div>
    </div>
  );
}
