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
  
          const user = await prisma.user.findFirst({
              where: {
                  OR: [
                      { email: credentials.identifier },
                      { phone: credentials.identifier }
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
  
          return user;
        },
      }),
  
  ],
  // events: {
  //   async createUser({ user }) {
  //     console.log("🆕 User created via OAuth. Generating roadmap...");
  //     //init_roadmap(user.id)
  //   }
  // },
  
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.sub; // Ensure ID is passed to session
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