"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <footer className="hidden md:block text-center py-4 text-xs text-gray-400 border-t bg-white">
        &copy; {new Date().getFullYear()} Prière ICC. Tous droits réservés.
      </footer>
    );
  }

  return (
    <footer className="text-center py-4 text-xs text-gray-500 border-t bg-white safe-padding-bottom">
      &copy; {new Date().getFullYear()} Prière ICC. Tous droits réservés.
    </footer>
  );
}
