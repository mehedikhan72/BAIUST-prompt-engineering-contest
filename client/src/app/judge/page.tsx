'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import PhaseEditor from '@/components/judge/PhaseEditor';
import TeamEditor from '@/components/judge/TeamEditor';
import SubmissionJudge from '@/components/judge/SubmissionJudge';

export default function JudgePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<'phases' | 'teams' | 'submissions'>('phases');

  useEffect(() => {
    if (!user || user.role !== 'JUDGE') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'JUDGE') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Judge Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/leaderboard"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                View Leaderboard
              </a>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('phases')}
              className={`${
                activeTab === 'phases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Phases & Levels
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Submissions
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {activeTab === 'phases' && <PhaseEditor />}
          {activeTab === 'teams' && <TeamEditor />}
          {activeTab === 'submissions' && <SubmissionJudge />}
        </div>
      </div>
    </div>
  );
}

