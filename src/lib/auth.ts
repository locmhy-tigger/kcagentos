import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const ALLOWED_DOMAIN = "gs.keichi.edu.hk";

export const authOptions: NextAuthOptions = {
  // 移除 PrismaAdapter — JWT strategy 唔需要 Account/Session tables
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { hd: ALLOWED_DOMAIN },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return false;

      // 首次登入自動建 User，更新 lastLoginAt
      await prisma.user.upsert({
        where: { email },
        update: { lastLoginAt: new Date(), name: profile?.name ?? email.split("@")[0] },
        create: {
          email,
          name: profile?.name ?? email.split("@")[0],
          role: "TEACHER",
          lastLoginAt: new Date(),
        },
      });
      return true;
    },
    async jwt({ token }) {
      // 每次刷新 token 時從 DB 取最新角色（確保角色變更即時生效）
      const email = token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, department: true, isActive: true },
        });
        if (dbUser) {
          if (!dbUser.isActive) throw new Error("account_disabled");
          token.userId     = dbUser.id;
          token.role       = dbUser.role;
          token.department = dbUser.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.userId as string;
        session.user.role       = token.role as Role;
        session.user.department = token.department as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
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
    role:   session.user.role as Role,
    email:  session.user.email!,
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

