'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import ContestTime from '@/components/ContestTime';

export default function TeamPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user || user.role !== 'TEAM') {
      router.push('/');
    }
  }, [user, router]);

  const { data: progress } = useQuery({
    queryKey: ['team-progress'],
    queryFn: async () => {
      const res = await api.get('/team/progress');
      return res.data.progress;
    },
    enabled: !!user,
    refetchInterval: 5000, // Auto-refresh every 5 seconds to show real-time progress
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });

  const { data: phasesData } = useQuery({
    queryKey: ['team-phases'],
    queryFn: async () => {
      const res = await api.get('/team/phases');
      return res.data.phases;
    },
    enabled: !!user,
  });

  const { data: contest } = useQuery({
    queryKey: ['contest-info'],
    queryFn: async () => {
      const res = await api.get('/leaderboard');
      return res.data.contest as { startTime: string; endTime: string; isActive?: boolean } | null;
    },
    refetchInterval: 10000,
  });

  if (!user || user.role !== 'TEAM') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{user.teamName}</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Penalty: {progress?.totalPenalty || 0} min
                </span>
              </div>
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

      {/* Main Content */}
      <ContestTime contest={contest} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Phase 1 */}
          <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 ${
            progress?.unlockedPhases?.includes(1) ? 'hover:border-slate-300 dark:hover:border-slate-700' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Phase 1</h2>
              <span className="text-3xl">🔐</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Password Retrieval via RAG Agent</p>
            {progress?.unlockedPhases?.includes(1) ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isUnlocked = progress.unlockedLevels.some(
                    (ul: any) => ul.phase === 1 && ul.level === level
                  );
                  const isCompleted = progress.completedLevels.some(
                    (cl: any) => cl.phase === 1 && cl.level === level
                  );
                  return (
                    <Link
                      key={level}
                      href={isUnlocked ? `/team/phase1/${level}` : '#'}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : isUnlocked
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-medium">Level {level}</span>
                      <span className="text-lg">{isCompleted ? '✓' : isUnlocked ? '→' : '🔒'}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">🔒 Phase Locked</p>
              </div>
            )}
          </div>

          {/* Phase 2 */}
          <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 ${
            progress?.unlockedPhases?.includes(2) ? 'hover:border-slate-300 dark:hover:border-slate-700' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Phase 2</h2>
              <span className="text-3xl">🎨</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Reverse Prompt Engineering</p>
            {progress?.unlockedPhases?.includes(2) ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isUnlocked = progress.unlockedLevels.some(
                    (ul: any) => ul.phase === 2 && ul.level === level
                  );
                  const isCompleted = progress.completedLevels.some(
                    (cl: any) => cl.phase === 2 && cl.level === level
                  );
                  return (
                    <Link
                      key={level}
                      href={isUnlocked ? `/team/phase2/${level}` : '#'}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : isUnlocked
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-medium">Level {level}</span>
                      <span className="text-lg">{isCompleted ? '✓' : isUnlocked ? '→' : '🔒'}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">🔒 Complete Phase 1 Level 3</p>
              </div>
            )}
          </div>

          {/* Phase 3 */}
          <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 ${
            progress?.unlockedPhases?.includes(3) ? 'hover:border-slate-300 dark:hover:border-slate-700' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Phase 3</h2>
              <span className="text-3xl">🤖</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Build-Your-Own RAG System</p>
            {progress?.unlockedPhases?.includes(3) ? (
              <Link
                href="/team/phase3"
                className="flex items-center justify-between p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 transition-all duration-200"
              >
                <span className="font-medium">Start Phase 3</span>
                <span className="text-lg">→</span>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">🔒 Complete 3/5 Phase 2 Levels</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

