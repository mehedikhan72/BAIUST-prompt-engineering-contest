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
    <div className="relative w-full min-h-screen flex items-center justify-center font-sans overflow-hidden bg-white dark:bg-black">
      <div className="relative w-full max-w-sm p-6 mx-4 bg-white dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-900/50">
        <LoginForm />
      </div>
    </div>
  );
}

