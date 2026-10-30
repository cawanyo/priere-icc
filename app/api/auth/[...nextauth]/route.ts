import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
        name: "credentials",
        credentials: {
          identifier: { label: "Email ou Téléphone", type: "text" },
          password: { label: "Mot de passe", type: "password" }
      },
        async authorize(credentials) {
          if (!credentials?.identifier || !credentials?.password) {
            throw new Error("Invalid credentials");
          }
  
          const rawId = credentials.identifier.trim();
          const cleanEmail = rawId.toLowerCase();
          const cleanPhone = rawId.replace(/\s+/g, "");

          const user = await prisma.user.findFirst({
              where: {
                  OR: [
                      { email: cleanEmail },
                      { phone: cleanPhone },
                      { email: rawId },
                      { phone: rawId }
                  ]
              }
          });
  
          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }
  
          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
  
          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }

          if (user.role === "REQUESTER") {
            user.role = "PRAYER_LEADER";
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "PRAYER_LEADER" }
            }).catch(console.error);
          }
  
          return user;
        },
      }),
  
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "PRAYER_LEADER" }
        }).catch(console.error);
      }
    }
  },
  
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const uRole = (user as any).role;
        token.role = uRole === "REQUESTER" ? "PRAYER_LEADER" : uRole;
        token.phone = (user as any).phone;
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, phone: true }
        });
        if (dbUser) {
          if (dbUser.role === "REQUESTER") {
            await prisma.user.update({
              where: { id: token.sub },
              data: { role: "PRAYER_LEADER" }
            }).catch(console.error);
            token.role = "PRAYER_LEADER";
          } else {
            token.role = dbUser.role;
          }
          token.phone = dbUser.phone;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role === "REQUESTER" ? "PRAYER_LEADER" : token.role) as any;
        session.user.phone = token.phone as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };