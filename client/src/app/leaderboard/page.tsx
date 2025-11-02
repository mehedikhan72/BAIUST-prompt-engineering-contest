'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();

  const { data: leaderboard, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/leaderboard');
      return res.data.leaderboard;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Contest Leaderboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Live standings - Lower penalty ranks higher
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phase 1
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phase 2
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phase 3
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Penalty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Submit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {!leaderboard || leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No teams yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((team: any, index: number) => (
                    <tr
                      key={team.teamId}
                      className={index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                          {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                          {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.teamName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const completed = team.phase1Completed?.includes(level);
                            return (
                              <div
                                key={level}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                  completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                                title={`Level ${level}`}
                              >
                                {level}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const completed = team.phase2Completed?.includes(level);
                            const score = team.phase2Scores?.find((s: any) => s.level === level);
                            return (
                              <div
                                key={level}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                  completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                                title={score ? `Level ${level}: ${score.score}/10` : `Level ${level}`}
                              >
                                {score ? score.score : level}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {team.phase3Score !== null ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white">
                            {team.phase3Score}/10
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {team.totalPenalty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {team.lastSubmissionTime
                            ? new Date(team.lastSubmissionTime).toLocaleTimeString()
                            : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Legend</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-block w-6 h-6 bg-green-500 rounded mr-2"></span>
                Completed Level
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-block w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded mr-2"></span>
                Not Completed
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Phase 1:</strong> Each completed level adds time penalty
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Phase 2/3:</strong> Judge scores reduce penalty (higher score = bigger bonus)
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Ranking:</strong> Lower penalty = Higher rank. Tie-break by last submission time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

