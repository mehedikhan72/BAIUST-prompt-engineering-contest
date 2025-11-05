'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import { Upload, ImageIcon } from 'lucide-react';

export default function Phase2LevelPage() {
  const router = useRouter();
  const params = useParams();
  const level = parseInt(params.level as string);
  const user = useAuthStore((state) => state.user);

  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  
  // Reference image for AI guidance
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState('');
  const referenceInputRef = useRef<HTMLInputElement>(null);
  
  // Error state
  const [error, setError] = useState('');

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
    queryKey: ['team-submissions', level],
    queryFn: async () => {
      const res = await api.get('/team/submissions');
      return res.data.submissions.filter(
        (s: any) => s.phaseNumber === 2 && s.levelNumber === level
      );
    },
    refetchInterval: 3000, // Refresh to show updated submission status
  });

  const generateImage = useMutation({
    mutationFn: async (promptText: string) => {
      const formData = new FormData();
      formData.append('prompt', promptText);
      
      // Add reference image if provided
      if (referenceFile) {
        formData.append('referenceImage', referenceFile);
      }
      
      const res = await api.post(`/team/phase2/${level}/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message || 'Failed to generate image');
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
      alert(`🎉 Level ${level} submission sent for judging! You can now work on other levels while waiting.`);
      setPrompt('');
      setGeneratedImageUrl('');
      setReferenceFile(null);
      setReferencePreviewUrl('');
      setError('');
      
      // Refresh the page to show updated submission status
      window.location.reload();
    },
  });



  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
        return;
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      
      setReferenceFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferencePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Unused - removed user assets functionality
  // const handleUserAssetsChange = () => {};
  // const removeUserAsset = () => {};

  // Get the actual latest submission (sorted by date)
  const sortedSubmissions = submissions?.sort((a: any, b: any) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const latestSubmission = sortedSubmissions?.[0];

  // Determine if user can submit for THIS specific level
  const canSubmit = !latestSubmission || // No submission yet - can submit
    (latestSubmission.status === 'JUDGED' && latestSubmission.canResubmit); // Judged and allows resubmission

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Phase 2 - Level {level}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Reverse Prompt Engineering
              </p>
            </div>
            <button
              onClick={() => router.push('/team')}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Problem Info */}
          <div className="space-y-6">
            {/* Problem Title & Description */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {levelData?.name || `Problem ${level}`}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {levelData?.description || 'Use prompt engineering to recreate the reference image with the provided assets.'}
              </p>
            </div>

            {/* Reference Image */}
            {levelData?.referenceImage && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Reference Image</h3>
                <div className="relative w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Image
                    src={levelData.referenceImage}
                    alt="Reference"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Assets */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Assets</h3>
              
              {/* Provided Assets */}
              {levelData?.assets && levelData.assets.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">📦 Provided Assets:</p>
                  <div className="space-y-2">
                    {levelData.assets.map((asset: string, i: number) => {
                      const isUrl = asset.startsWith('http://') || asset.startsWith('https://');
                      
                      if (isUrl) {
                        return (
                          <a
                            key={i}
                            href={asset}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Asset {i + 1}: {asset.split('/').pop() || 'Download'}
                          </a>
                        );
                      }
                      
                      return (
                        <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                          <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
                          {asset}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User Assets Upload */}
            </div>
          </div>

          {/* Right Side - Simplified Interface */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-6 text-slate-900 dark:text-slate-100">Create Your Solution</h3>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3.5 rounded-xl mb-6">
                  {error}
                </div>
              )}
            
              {!canSubmit && latestSubmission?.status === 'PENDING' && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⏳ You have a pending submission for <strong>Level {level}</strong> waiting for judgement. You can work on other levels while waiting!
                  </p>
                </div>
              )}

              {!canSubmit && latestSubmission?.status === 'JUDGED' && !latestSubmission.canResubmit && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ Resubmission not allowed for <strong>Level {level}</strong>. Score: {latestSubmission.judgeScore}/{levelData?.maxScore || 10}
                  </p>
                  <p className="text-xs mt-2 text-red-700 dark:text-red-300">
                    You can continue working on other Phase 2 levels.
                  </p>
                </div>
              )}

              {latestSubmission?.status === 'JUDGED' && latestSubmission.judgeScore && latestSubmission.judgeScore >= Math.ceil((levelData?.maxScore || 10) * 0.1) && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    🎉 <strong>Level {level} Completed!</strong> Score: {latestSubmission.judgeScore}/{levelData?.maxScore || 10}
                  </p>
                  <p className="text-xs mt-2 text-emerald-700 dark:text-emerald-300">
                    This level is marked as completed. Check your team dashboard!
                  </p>
                </div>
              )}

              {/* 1. Prompt Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  ✍️ Prompt Text
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all duration-200"
                  disabled={!canSubmit}
                />
              </div>

              {/* 2. Reference Image */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  🖼️ Reference Image {referenceFile && '(1 image)'}
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  Upload a reference image to guide the AI generation (optional)
                </p>
                
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReferenceFileChange}
                  className="hidden"
                />
                
                <button
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={!canSubmit}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-4 font-medium rounded-lg border-2 border-dashed transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    referenceFile 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <Upload size={24} />
                  <div className="text-center">
                    <div className="font-semibold">
                      {referenceFile ? referenceFile.name : 'Choose Reference Image'}
                    </div>
                    <div className="text-xs opacity-75">
                      {referenceFile ? 'Click to change' : 'JPG, PNG, WEBP - Max 10MB'}
                    </div>
                  </div>
                </button>

                {/* Reference Image Preview */}
                {referencePreviewUrl && (
                  <div className="mt-4">
                    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <Image
                        src={referencePreviewUrl}
                        alt="Reference Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setReferenceFile(null);
                        setReferencePreviewUrl('');
                      }}
                      className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      Remove Reference Image
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Generate Button */}
              <button
                onClick={() => generateImage.mutate(prompt)}
                disabled={generateImage.isPending || !prompt.trim() || !canSubmit}
                className="w-full px-6 py-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold rounded-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
              >
                {generateImage.isPending 
                  ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Output...
                    </span>
                  )
                  : '🚀 Generate Output'
                }
              </button>
              
              {/* Loading Message */}
              {generateImage.isPending && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    🎨 {referenceFile ? 'Generating with reference image guidance...' : 'Creating your image...'} This may take 30-60 seconds.
                  </p>
                </div>
              )}

              {/* 4. Generated Output & Submit */}
              {generatedImageUrl && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-slate-100">✨ Generated Output:</h4>
                  <div className="relative w-full h-80 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
                    <Image
                      src={generatedImageUrl}
                      alt="Generated"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => submitImage.mutate()}
                    disabled={submitImage.isPending || generateImage.isPending}
                    className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
                  >
                    {submitImage.isPending ? 'Submitting...' : '📝 Submit for Judgement'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Previous Submissions */}
        {submissions && submissions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-6">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Previous Submissions</h3>
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <div key={sub._id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                      <p className={`text-sm font-semibold ${
                        sub.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 
                        sub.status === 'JUDGED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {sub.status}
                      </p>
                    </div>
                    {sub.status === 'JUDGED' && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {sub.judgeScore}/{levelData?.maxScore || 10}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {sub.canResubmit ? '✓ Can resubmit' : '✗ No resubmission'}
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

