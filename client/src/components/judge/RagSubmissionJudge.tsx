'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';

export default function RagSubmissionJudge() {
  const queryClient = useQueryClient();
  const [judgingSubmission, setJudgingSubmission] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [canResubmit, setCanResubmit] = useState(false);

  const { data: submissions } = useQuery({
    queryKey: ['judge-rag-submissions'],
    queryFn: async () => {
      const res = await api.get('/judge/submissions/pending');
      // Filter only RAG submissions (Phase 3)
      return res.data.submissions.filter((s: any) => s.phaseNumber === 3 && s.type === 'PHASE3_RAG');
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
      queryClient.invalidateQueries({ queryKey: ['judge-rag-submissions'] });
      setJudgingSubmission(null);
      setScore(0);
      setCanResubmit(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              RAG System Submissions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review and judge Phase 3 RAG submissions ({submissions?.length || 0} pending)
            </p>
          </div>
        </div>

        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">No RAG submissions pending</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">When teams submit their RAG systems, they'll appear here for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission: any) => (
              <div key={submission._id} className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {submission.teamId?.teamName || 'Unknown Team'}
                      </span>
                      <span className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Phase 3 - RAG System
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <span className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                        🧠 AI System
                      </span>
                      {submission.files && submission.files.length > 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                          📎 {submission.files.length} file{submission.files.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {(() => {
                        try {
                          const parsed = JSON.parse(submission.content);
                          return parsed.apiEndpoint && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full">
                              🔗 API Deployed
                            </span>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">Team:</span> {submission.teamId?.teamName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Preview of description */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(submission.content);
                        const preview = parsed.description?.substring(0, 150) + (parsed.description?.length > 150 ? '...' : '');
                        return (
                          <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              "{preview}"
                            </p>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  
                  <button
                    onClick={() => {
                      setJudgingSubmission(submission);
                      setScore(0);
                      setCanResubmit(false);
                    }}
                    className="ml-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Judge RAG System
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
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Judge RAG System - {judgingSubmission.teamId?.teamName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Phase 3 - RAG System Submission
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {(() => {
                try {
                  const parsed = JSON.parse(judgingSubmission.content);
                  return (
                    <>
                      <div>
                        <p className="font-medium mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          RAG System Description
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                          <pre className="whitespace-pre-wrap font-sans">{parsed.description}</pre>
                        </div>
                      </div>
                      
                      {parsed.apiEndpoint && (
                        <div>
                          <p className="font-medium mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            API Endpoint
                          </p>
                          <div className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <a 
                              href={parsed.apiEndpoint} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-700 dark:text-green-400 hover:underline font-mono break-all"
                            >
                              {parsed.apiEndpoint}
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  );
                } catch {
                  return (
                    <div>
                      <p className="font-medium mb-2 text-gray-900 dark:text-white">Submission Content:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded whitespace-pre-wrap">
                        {judgingSubmission.content}
                      </p>
                    </div>
                  );
                }
              })()}
              
              {judgingSubmission.files && judgingSubmission.files.length > 0 && (
                <div>
                  <p className="font-medium mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Uploaded Files ({judgingSubmission.files.length})
                  </p>
                  <div className="grid gap-2">
                    {judgingSubmission.files.map((file: string, i: number) => {
                      const fileName = file.split('/').pop() || `File ${i + 1}`;
                      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                      const isCode = ['py', 'js', 'ts', 'json', 'txt', 'md', 'yml', 'yaml'].includes(fileExtension);
                      const isPdf = fileExtension === 'pdf';
                      
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex-shrink-0">
                            {isCode ? (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            ) : isPdf ? (
                              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                              {fileExtension || 'file'}
                            </p>
                          </div>
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                          >
                            Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Score (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="canResubmit"
                  checked={canResubmit}
                  onChange={(e) => setCanResubmit(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="canResubmit" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow team to resubmit after scoring
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    judgeSubmission.mutate({
                      submissionId: judgingSubmission._id,
                      score: score,
                      canResubmit: canResubmit
                    });
                  }}
                  disabled={judgeSubmission.isPending}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200"
                >
                  {judgeSubmission.isPending ? 'Submitting...' : 'Submit Judgment'}
                </button>
                <button
                  onClick={() => setJudgingSubmission(null)}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
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
