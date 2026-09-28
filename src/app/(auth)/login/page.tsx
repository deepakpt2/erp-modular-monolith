"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password. Please try again.');
    } else if (res?.ok) {
      router.push(callbackUrl);
    }
  };

  return (
    <>
      <div className="border-b pb-3 mb-4">
        <h1 className="text-xl font-semibold">Sign in to ERP</h1>
        <p className="text-xs text-zinc-500 mt-1">Secure access to your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="you@company.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-full px-4 py-2.5 font-medium text-sm hover:bg-zinc-800 disabled:opacity-50 transition"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-[11px] text-zinc-500">
        <p>Contact your administrator if you need access.</p>
        <p className="mt-1">Your session is encrypted and secure.</p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black mx-auto text-xl">E</div>
          <div className="mt-3 font-semibold">ERP System</div>
          <div className="text-xs text-zinc-500">Enterprise Resource Planning</div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<div className="text-xs text-zinc-500">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-4 text-center text-[11px] text-zinc-400">
          Secure login • Encrypted session
        </div>
      </div>
    </div>
  );
}
