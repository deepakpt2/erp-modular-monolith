import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClientPage from './client-page';

export default async function HomePage() {
  const mvpNoAuth = process.env.MVP_NO_AUTH === 'true';
  
  if (!mvpNoAuth) {
    const session = await auth();
    if (!session || !session.user) {
      redirect('/login?callbackUrl=/&reason=no_session');
    }
  }
  
  return <ClientPage />;
}
