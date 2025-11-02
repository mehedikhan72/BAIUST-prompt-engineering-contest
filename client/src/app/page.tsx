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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Prompt Engineering Contest
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ICPC-style Competition
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

