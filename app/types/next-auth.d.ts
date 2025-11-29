import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      phone?: string,
      role?: string
    } & DefaultSession["user"];
  }
}

interface User {
  role: Role;
  phone?: string | null;
}


declare module "next-auth/jwt" {
/**
 * Étend le token JWT pour y stocker le rôle
 */
  interface JWT {
    role: Role;
    id: string;
  }
}