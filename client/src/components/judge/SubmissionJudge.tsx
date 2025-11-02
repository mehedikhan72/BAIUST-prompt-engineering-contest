'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';

export default function SubmissionJudge() {
  const queryClient = useQueryClient();
  const [judgingSubmission, setJudgingSubmission] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [canResubmit, setCanResubmit] = useState(false);

  const { data: submissions } = useQuery({
    queryKey: ['judge-submissions'],
    queryFn: async () => {
      const res = await api.get('/judge/submissions/pending');
      return res.data.submissions;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const judgeSubmission = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/judge/submissions/${data.submissionId}/judge`, {
        score: data.score,
        canResubmit: data.canResubmit
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-submissions'] });
      setJudgingSubmission(null);
      setScore(0);
      setCanResubmit(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Pending Submissions ({submissions?.length || 0})
        </h2>

        {!submissions || submissions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No pending submissions</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission: any) => (
              <div key={submission._id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {submission.teamId?.teamName || 'Unknown Team'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        Phase {submission.phaseNumber} - Level {submission.levelNumber}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Type: {submission.type}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setJudgingSubmission(submission);
                      setScore(0);
                      setCanResubmit(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Judge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Judge Modal */}
      {judgingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Judge Submission - {judgingSubmission.teamId?.teamName}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phase {judgingSubmission.phaseNumber} - Level {judgingSubmission.levelNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {judgingSubmission.type}
                </p>
              </div>

              {judgingSubmission.type === 'PHASE2_IMAGE' && (
                <div>
                  <p className="font-medium mb-2 text-gray-900 dark:text-white">Prompt:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {judgingSubmission.content}
                  </p>
                  {judgingSubmission.generatedImageUrl && (
                    <div className="mt-4">
                      <p className="font-medium mb-2 text-gray-900 dark:text-white">Generated Image:</p>
                      <div className="relative w-full h-64">
                        <Image
                          src={judgingSubmission.generatedImageUrl}
                          alt="Generated image"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {judgingSubmission.type === 'PHASE3_RAG' && (
                <div>
                  <p className="font-medium mb-2 text-gray-900 dark:text-white">Description:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded whitespace-pre-wrap">
                    {(() => {
                      try {
                        const parsed = JSON.parse(judgingSubmission.content);
                        return `Description: ${parsed.description}\n\nAPI Endpoint: ${parsed.apiEndpoint || 'N/A'}`;
                      } catch {
                        return judgingSubmission.content;
                      }
                    })()}
                  </p>
                  {judgingSubmission.files && judgingSubmission.files.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2 text-gray-900 dark:text-white">Files:</p>
                      <ul className="space-y-1">
                        {judgingSubmission.files.map((file: string, i: number) => (
                          <li key={i}>
                            <a
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              File {i + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Score (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="canResubmit"
                  checked={canResubmit}
                  onChange={(e) => setCanResubmit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="canResubmit" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Allow team to resubmit
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => judgeSubmission.mutate({
                    submissionId: judgingSubmission._id,
                    score,
                    canResubmit
                  })}
                  disabled={judgeSubmission.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {judgeSubmission.isPending ? 'Submitting...' : 'Submit Judgement'}
                </button>
                <button
                  onClick={() => setJudgingSubmission(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

