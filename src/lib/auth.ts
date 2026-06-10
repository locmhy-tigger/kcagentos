import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const ALLOWED_DOMAIN = "gs.keichi.edu.hk";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: ALLOWED_DOMAIN,
        },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return "/login?error=domain";
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true, department: true, name: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        session.user.department = token.department as string | null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      await prisma.user.upsert({
        where: { email: user.email },
        update: { lastLoginAt: new Date() },
        create: {
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          role: "TEACHER",
          lastLoginAt: new Date(),
        },
      });
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireRole(
  ...roles: Role[]
): Promise<{ userId: string; role: Role; email: string }> {
  const session = await getSession();
  if (!session?.user?.id) throw new AuthError(401, "未登入");
  if (!roles.includes(session.user.role as Role))
    throw new AuthError(403, "權限不足");
  return {
    userId: session.user.id,
    role: session.user.role as Role,
    email: session.user.email!,
  };
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
