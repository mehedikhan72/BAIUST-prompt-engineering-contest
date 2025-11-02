'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';

export default function Phase2LevelPage() {
  const router = useRouter();
  const params = useParams();
  const level = parseInt(params.level as string);
  const user = useAuthStore((state) => state.user);

  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'TEAM') {
      router.push('/');
    }
  }, [user, router]);

  const { data: levelData } = useQuery({
    queryKey: ['phase2-level', level],
    queryFn: async () => {
      const res = await api.get(`/team/phases/2/levels`);
      return res.data.levels.find((l: any) => l.levelNumber === level);
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ['team-submissions'],
    queryFn: async () => {
      const res = await api.get('/team/submissions');
      return res.data.submissions.filter(
        (s: any) => s.phaseNumber === 2 && s.levelNumber === level
      );
    },
  });

  const generateImage = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await api.post(`/team/phase2/${level}/generate`, { prompt: promptText });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
    },
  });

  const submitImage = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/team/phase2/${level}/submit`, {
        prompt,
        imageUrl: generatedImageUrl
      });
      return res.data;
    },
    onSuccess: () => {
      alert('Submission sent for judging!');
      setPrompt('');
      setGeneratedImageUrl('');
      router.push('/team');
    },
  });

  const latestSubmission = submissions?.[0];
  const canSubmit = !latestSubmission || 
    (latestSubmission.status === 'JUDGED' && latestSubmission.canResubmit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {levelData?.name || `Phase 2 - Level ${level}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {levelData?.description || 'Reverse Prompt Engineering'}
              </p>
            </div>
            <button
              onClick={() => router.push('/team')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reference Image & Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Reference Image & Assets</h3>
            {levelData?.referenceImage && (
              <div className="mb-4">
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Image
                    src={levelData.referenceImage}
                    alt="Reference"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
            {levelData?.assets && levelData.assets.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Assets to include:</p>
                <div className="space-y-2">
                  {levelData.assets.map((asset: string, i: number) => {
                    // Check if asset is a URL (for downloadable assets)
                    const isUrl = asset.startsWith('http://') || asset.startsWith('https://');
                    
                    if (isUrl) {
                      return (
                        <a
                          key={i}
                          href={asset}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Asset {i + 1}: {asset.split('/').pop() || 'Download'}
                        </a>
                      );
                    }
                    
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {asset}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Prompt & Generation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Your Prompt</h3>
            
            {!canSubmit && latestSubmission?.status === 'PENDING' && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You have a pending submission waiting for judgement.
                </p>
              </div>
            )}

            {!canSubmit && latestSubmission?.status === 'JUDGED' && !latestSubmission.canResubmit && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Resubmission not allowed. Score: {latestSubmission.judgeScore}/{levelData?.maxScore || 10}
                </p>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write your prompt to recreate the reference image..."
              rows={6}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              disabled={!canSubmit}
            />

            <button
              onClick={() => generateImage.mutate(prompt)}
              disabled={generateImage.isPending || !prompt.trim() || !canSubmit}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mb-4 disabled:opacity-50"
            >
              {generateImage.isPending ? 'Generating...' : 'Generate Image'}
            </button>

            {generatedImageUrl && (
              <div>
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Generated Image:</p>
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                  <Image
                    src={generatedImageUrl}
                    alt="Generated"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <button
                  onClick={() => submitImage.mutate()}
                  disabled={submitImage.isPending}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {submitImage.isPending ? 'Submitting...' : 'Submit for Judging'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Previous Submissions */}
        {submissions && submissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Previous Submissions</h3>
            <div className="space-y-4">
              {submissions.map((sub: any) => (
                <div key={sub._id} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium ${
                        sub.status === 'PENDING' ? 'text-yellow-600' : 
                        sub.status === 'JUDGED' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sub.status}
                      </p>
                    </div>
                    {sub.status === 'JUDGED' && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {sub.judgeScore}/{levelData?.maxScore || 10}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {sub.canResubmit ? 'Can resubmit' : 'No resubmission'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

