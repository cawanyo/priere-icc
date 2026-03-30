export type MobileUser = {
  id: string;
  name: string | null;
  role: string;
  image?: string | null;
  prayerFamily?: { id: string; name: string } | null;
};
