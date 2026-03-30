"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const MD_BREAKPOINT = 768;

function getTarget(pathname: string, isDesktop: boolean): string | null {
  const isMobilePath  = pathname.startsWith("/dashboard/mobile");
  const isDesktopPath = pathname.startsWith("/dashboard/desktop");

  if (!isMobilePath && !isDesktopPath) return null;

  if (isDesktop && isMobilePath) {
    return pathname.replace("/dashboard/mobile", "/dashboard/desktop");
  }
  if (!isDesktop && isDesktopPath) {
    return pathname.replace("/dashboard/desktop", "/dashboard/mobile");
  }
  return null;
}

export function ResponsiveRedirector() {
  const router   = useRouter();
  const pathname = usePathname();
  const prevWidth = useRef<number | null>(null);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const isDesktop = w >= MD_BREAKPOINT;

      if (prevWidth.current !== null) {
        const wasDesktop = prevWidth.current >= MD_BREAKPOINT;
        if (wasDesktop === isDesktop) return;
      }
      prevWidth.current = w;

      const target = getTarget(pathname, isDesktop);
      if (target) {
        router.replace(target);
      }
    }

    prevWidth.current = window.innerWidth;
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, router]);

  return null;
}
