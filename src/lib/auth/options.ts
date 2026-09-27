import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verify } from "argon2";
import { z } from "zod";
import { bootstrapEnvironmentOwner, findActiveStaffByEmail, findActiveStaffByUsername } from "./staff";
import { isStaffRole } from "./permissions";
import { authSecret } from "./environment";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(191),
  password: z.string().min(1).max(1024),
});

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Acadimies staff",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        let staff = await findActiveStaffByUsername(parsed.data.username);
        const passwordMatches = staff?.passwordHash
          ? await verify(staff.passwordHash, parsed.data.password)
          : false;
        if (!passwordMatches) {
          staff = await bootstrapEnvironmentOwner(parsed.data.username, parsed.data.password);
        }
        if (!staff) return null;

        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
        };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;
      return Boolean(await findActiveStaffByEmail(user.email));
    },
    async jwt({ token, user }) {
      if (user && "role" in user && isStaffRole(user.role)) {
        token.staffId = user.id;
        token.role = user.role;
      } else if (user?.email) {
        const staff = await findActiveStaffByEmail(user.email);
        if (staff) {
          token.staffId = staff.id;
          token.role = staff.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.staffId === "string" && isStaffRole(token.role)) {
        session.user.id = token.staffId;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
