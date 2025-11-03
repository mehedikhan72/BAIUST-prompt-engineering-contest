'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      if (user.role === 'JUDGE') {
        router.push('/judge');
      } else if (user.role === 'TEAM') {
        router.push('/team');
      }
    }
  }, [user, router]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center font-sans overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="relative w-full max-w-sm p-6 mx-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <LoginForm />
      </div>
    </div>
  );
}

