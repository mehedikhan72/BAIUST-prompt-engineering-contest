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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">⚖️ Judge Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/leaderboard"
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors duration-200"
              >
                Leaderboard
              </a>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('phases')}
              className={`${
                activeTab === 'phases'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-200`}
            >
              Phases & Levels
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`${
                activeTab === 'teams'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-200`}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`${
                activeTab === 'submissions'
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-200`}
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

