import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) redirect("/login");

  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">
      <DesktopSidebar
        userRole={user.role}
        userName={user.name ?? "Membre"}
        userImage={user.image}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
      <MobileBottomNav userRole={user.role} />
    </div>
  );
}
