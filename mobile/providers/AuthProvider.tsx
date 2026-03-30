import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSession, saveSession, clearSession } from "@/lib/storage";
import type { MobileUser } from "@/lib/types";

type AuthContextValue = {
  user: MobileUser | null;
  loading: boolean;
  signIn: (user: MobileUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((value) => {
        if (!mounted) return;
        if (value) setUser(JSON.parse(value));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (nextUser: MobileUser) => {
        setUser(nextUser);
        await saveSession(JSON.stringify(nextUser));
      },
      signOut: async () => {
        setUser(null);
        await clearSession();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
