import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const result = await db.execute(sql`
            SELECT id, email, name, role, password_hash, is_active
            FROM auth_user
            WHERE email = ${email}
            LIMIT 1
          `);

          if (result.rows.length === 0) {
            console.log(`Auth failed: user not found ${email}`);
            return null;
          }

          const user = result.rows[0] as any;

          if (!user.is_active) {
            console.log(`Auth failed: user inactive ${email}`);
            return null;
          }

          if (!user.password_hash) {
            console.log(`Auth failed: no password hash for ${email} - run seed or createAdmin`);
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            console.log(`Auth failed: invalid password for ${email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as any;
        } catch (e) {
          console.error('Auth error:', e);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
