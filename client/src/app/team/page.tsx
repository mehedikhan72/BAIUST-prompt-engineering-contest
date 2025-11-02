'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

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
  });

  const { data: phasesData } = useQuery({
    queryKey: ['team-phases'],
    queryFn: async () => {
      const res = await api.get('/team/phases');
      return res.data.phases;
    },
    enabled: !!user,
  });

  if (!user || user.role !== 'TEAM') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.teamName}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Penalty: {progress?.totalPenalty || 0} minutes
              </p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Phase 1 */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
            progress?.unlockedPhases?.includes(1) ? '' : 'opacity-50'
          }`}>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Phase 1</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Password Retrieval</p>
            {progress?.unlockedPhases?.includes(1) ? (
              <div className="space-y-2">
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
                      className={`block p-3 rounded border ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : isUnlocked
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:bg-blue-100'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        Level {level} {isCompleted ? '✓' : isUnlocked ? '→' : '🔒'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Locked</p>
            )}
          </div>

          {/* Phase 2 */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
            progress?.unlockedPhases?.includes(2) ? '' : 'opacity-50'
          }`}>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Phase 2</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Reverse Prompt Engineering</p>
            {progress?.unlockedPhases?.includes(2) ? (
              <div className="space-y-2">
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
                      className={`block p-3 rounded border ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : isUnlocked
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:bg-blue-100'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        Level {level} {isCompleted ? '✓' : isUnlocked ? '→' : '🔒'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Complete Phase 1 Level 3 to unlock</p>
            )}
          </div>

          {/* Phase 3 */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
            progress?.unlockedPhases?.includes(3) ? '' : 'opacity-50'
          }`}>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Phase 3</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Build-Your-Own RAG</p>
            {progress?.unlockedPhases?.includes(3) ? (
              <Link
                href="/team/phase3"
                className="block p-3 rounded border bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:bg-blue-100"
              >
                <span className="text-sm font-medium">Start Phase 3 →</span>
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Complete Phase 2 to unlock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

