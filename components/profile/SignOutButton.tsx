"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full justify-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50/60 border-slate-200 hover:border-rose-200 rounded-xl h-10 transition-colors cursor-pointer shadow-xs"
    >
      <LogOut className="h-4 w-4 text-rose-500" />
      Se déconnecter
    </Button>
  );
}
