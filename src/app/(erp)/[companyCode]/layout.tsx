import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CompanyClientLayout from './client-layout';

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyCode: string }>;
}) {
  const { companyCode } = await params;
  
  // SECURE BY DEFAULT: only allow open mode if explicitly MVP_NO_AUTH=true
  const mvpNoAuth = process.env.MVP_NO_AUTH === 'true';
  
  if (!mvpNoAuth) {
    // Secure mode - require session
    const session = await auth();
    if (!session || !session.user) {
      // Redirect to login with callback
      redirect(`/login?callbackUrl=/${companyCode}/foundation/materials&reason=no_session`);
    }
    
    // Session valid - render with user info
    return (
      <CompanyClientLayout 
        companyCode={companyCode} 
        userEmail={session.user.email || undefined}
        userRole={(session.user as any).role || 'USER'}
      >
        {children}
      </CompanyClientLayout>
    );
  }

  // MVP open mode - no auth required (demo only)
  return (
    <CompanyClientLayout companyCode={companyCode}>
      {children}
    </CompanyClientLayout>
  );
}
