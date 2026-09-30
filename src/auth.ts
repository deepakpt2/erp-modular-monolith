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
        if (!credentials?.email || !credentials?.password) {
          console.log('Auth failed: missing email or password');
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        console.log(`Auth attempt: ${email} – checking auth_user`);

        try {
          // Use sql with explicit handling for pgbouncer transaction mode – disable prepared statements if needed
          const result = await db.execute(sql`
            SELECT id, email, name, role, password_hash, is_active
            FROM auth_user
            WHERE LOWER(email) = ${email}
            LIMIT 1
          `);

          if (result.rows.length === 0) {
            console.log(`Auth failed: user not found ${email} – check auth_user table – run AUTO_MIGRATE or docker compose exec postgres psql -U postgres -d erp -c "SELECT email FROM auth_user;"`);
            return null;
          }

          const user = result.rows[0] as any;

          console.log(`Auth found: ${user.email} – role ${user.role} – active ${user.is_active} – has hash ${!!user.password_hash} length ${user.password_hash?.length || 0}`);

          if (!user.is_active) {
            console.log(`Auth failed: user inactive ${email} – set is_active=true via UPDATE auth_user SET is_active=true WHERE email='${email}'`);
            return null;
          }

          if (!user.password_hash) {
            console.log(`Auth failed: no password hash for ${email} - run seed or createAdmin – auto-migrate should re-sync password from .env ADMIN_PASSWORD`);
            return null;
          }

          // bcrypt compare – handle both $2a$ and $2b$ prefixes
          let isValid = false;
          try {
            isValid = await bcrypt.compare(password, user.password_hash);
          } catch (bcryptErr: any) {
            console.error(`Auth bcrypt compare error for ${email}:`, bcryptErr.message, '– hash may be corrupted – try resetting via auto-migrate');
            // Try re-hash check with trimmed password
            try {
              isValid = await bcrypt.compare(password.trim(), user.password_hash.trim());
            } catch {}
          }

          if (!isValid) {
            console.log(`Auth failed: invalid password for ${email} – expected ADMIN_PASSWORD from .env – current .env ADMIN_PASSWORD length ${process.env.ADMIN_PASSWORD?.length || 0} – if changed, auto-migrate re-syncs on startup – or run docker compose run --rm migrator npm run db:create-admin`);
            return null;
          }

          console.log(`Auth success: ${email} – role ${user.role}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as any;
        } catch (e: any) {
          console.error('Auth error – DB connection or query failed:', e.message, e.stack?.slice(0,500));
          console.error('Check DATABASE_URL:', process.env.DATABASE_URL ? 'set – ' + process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NOT SET');
          console.error('Check if postgres container is healthy: docker compose ps, docker compose logs postgres');
          console.error('If using pgbouncer, ensure DATABASE_URL points to postgres:5432 not pgbouncer:6432 for auth, or disable prepared statements – current pool may need restart');
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
