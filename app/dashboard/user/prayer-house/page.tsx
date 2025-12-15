import { UserNightBoard } from "../../prayer-house/UserNightBoard";


export default function UserPrayerHousePage() {
  return (
    <div className="flex-1 p-6 md:p-8 pt-6 space-y-8 bg-gray-50/30 min-h-screen">
      <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
            Maison de Prière
          </h2>
          <p className="text-muted-foreground">
            Espace Sentinelle : Tours de garde (00h - 04h).
          </p>
      </div>

      <UserNightBoard />
    </div>
  );
}