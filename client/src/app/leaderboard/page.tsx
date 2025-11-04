"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import ContestTime from "@/components/ContestTime";

export default function LeaderboardPage() {
  const router = useRouter();

  const { data: leaderboardData, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await api.get("/leaderboard");
      return res.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  const leaderboard = leaderboardData?.leaderboard || [];
  const contest = leaderboardData?.contest;

  // Countdown handled by ContestTime component

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">🏆 Leaderboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ranked by problems solved, then by penalty time</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors duration-200"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Contest Time (compact) */}
      <ContestTime contest={contest} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Solved
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Penalty
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Phase 1
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Phase 2
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Phase 3
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Last Submit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {!leaderboard || leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No teams yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((team: any, index: number) => (
                    <tr
                      key={team.teamId}
                      className={
                        index < 3 ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{team.teamName}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {team.problemsSolved || 0}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">problems</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{team.totalPenalty}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">minutes</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const completed = team.phase1Completed?.includes(level);
                            return (
                              <div
                                key={level}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors duration-200 ${
                                  completed
                                    ? "bg-emerald-500 border-emerald-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                }`}
                                title={`Level ${level}`}
                              >
                                {completed ? "✓" : level}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const completed = team.phase2Completed?.includes(level);
                            const score = team.phase2Scores?.find((s: any) => s.level === level);
                            return (
                              <div
                                key={level}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors duration-200 ${
                                  completed
                                    ? "bg-emerald-500 border-emerald-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                }`}
                                title={score ? `Level ${level}: ${score.score}/10` : `Level ${level}`}
                              >
                                {score ? score.score : completed ? "✓" : level}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {team.phase3Score !== null ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500 border border-emerald-600 text-white">
                            {team.phase3Score}/10
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {team.lastSubmissionTime ? new Date(team.lastSubmissionTime).toLocaleTimeString() : "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
