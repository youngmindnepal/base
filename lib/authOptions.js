// lib/authOptions.js
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { verifyPassword, resolveRoles } from './auth';

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        if (user.status !== 'ACTIVE') return null;

        const ok = await verifyPassword(credentials.password, user.password);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Permissions are intentionally NOT resolved here.
        // The policy engine (can()) reads them per-request from the DB.
        const roles = await resolveRoles(user.id);

        return {
          id: String(user.id),
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.email,
          mustChangePassword: user.mustChangePassword,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.mustChangePassword = user.mustChangePassword;
        // Roles are kept only as a UI hint; the server never trusts them.
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.mustChangePassword = token.mustChangePassword;
      // UI-only hint, refreshed on token rotation — not an authorization source.
      session.user.roles = token.roles || [];
      // permissions are NOT embedded; fetched per-request by the policy engine
      return session;
    },
  },
};
