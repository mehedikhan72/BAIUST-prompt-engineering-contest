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
  
  // Reference image for AI generation
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const referenceInputRef = useRef<HTMLInputElement>(null);
  
  // User assets upload
  const [userAssets, setUserAssets] = useState<File[]>([]);
  const [userAssetPreviews, setUserAssetPreviews] = useState<string[]>([]);
  const userAssetsInputRef = useRef<HTMLInputElement>(null);
  
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
      const formData = new FormData();
      formData.append('prompt', promptText);
      
      // Add reference image if uploaded
      if (referenceFile) {
        formData.append('referenceImage', referenceFile);
      }
      
      // Add user assets
      userAssets.forEach((asset, index) => {
        formData.append(`asset_${index}`, asset);
      });
      
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
      alert('Submission sent for judging!');
      setPrompt('');
      setGeneratedImageUrl('');
      setReferenceFile(null);
      setReferencePreviewUrl('');
      setUserAssets([]);
      setUserAssetPreviews([]);
      setError('');
      router.push('/team');
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

  const handleUserAssetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate file size (10MB max per file)
      const maxSize = 10 * 1024 * 1024;
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          alert(`File ${file.name} exceeds 10MB limit.`);
          return false;
        }
        return true;
      });
      
      setUserAssets(prev => [...prev, ...validFiles]);
      
      // Create preview URLs for images
      validFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setUserAssetPreviews(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          setUserAssetPreviews(prev => [...prev, '']);
        }
      });
    }
  };

  const removeUserAsset = (index: number) => {
    setUserAssets(prev => prev.filter((_, i) => i !== index));
    setUserAssetPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const latestSubmission = submissions?.[0];
  const canSubmit = !latestSubmission || 
    (latestSubmission.status === 'JUDGED' && latestSubmission.canResubmit);

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
              <div>
                <p className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">📎 Upload Your Assets:</p>
                <input
                  ref={userAssetsInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleUserAssetsChange}
                  className="hidden"
                />
                <button
                  onClick={() => userAssetsInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-200"
                >
                  <Upload size={20} />
                  <span>{userAssets.length > 0 ? `${userAssets.length} files selected` : 'Upload Assets'}</span>
                </button>
                
                {/* User Assets Preview */}
                {userAssets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {userAssets.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeUserAsset(i)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Prompt & Generation */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Image Generation</h3>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3.5 rounded-xl mb-4">
                  {error}
                </div>
              )}
            
            {!canSubmit && latestSubmission?.status === 'PENDING' && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⏳ You have a pending submission waiting for judgement.
                </p>
              </div>
            )}

            {!canSubmit && latestSubmission?.status === 'JUDGED' && !latestSubmission.canResubmit && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ Resubmission not allowed. Score: {latestSubmission.judgeScore}/{levelData?.maxScore || 10}
                </p>
              </div>
            )}

              {/* Reference Image Upload (Optional - for AI generation) */}
              <div className={`mb-4 p-4 rounded-xl border ${
                referenceFile 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 ${
                  referenceFile 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {referenceFile ? '✅ Reference Image Ready' : '💡 Optional: Upload Reference Image'}
                </h4>
                <p className={`text-xs mb-3 ${
                  referenceFile 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {referenceFile 
                    ? 'Reference image will be sent directly to AI for generation.' 
                    : 'Upload a reference image to guide the AI generation (directly to GPT)'
                  }
                </p>
                
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReferenceFileChange}
                  className="hidden"
                  disabled={!canSubmit}
                />
                
                <button
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                >
                  <ImageIcon size={20} />
                  <span>{referenceFile ? referenceFile.name : 'Choose Reference Image'}</span>
                </button>

                {referencePreviewUrl && (
                  <div className="mt-3">
                    <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 border border-slate-200 dark:border-slate-700">
                      <Image
                        src={referencePreviewUrl}
                        alt="Reference Preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setReferenceFile(null);
                        setReferencePreviewUrl('');
                      }}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Remove Reference
                    </button>
                  </div>
                )}
              </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write your prompt to recreate the reference image..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg mb-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all duration-200"
              disabled={!canSubmit}
            />

              <button
                onClick={() => generateImage.mutate(prompt)}
                disabled={generateImage.isPending || !prompt.trim() || !canSubmit}
                className="w-full px-4 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {generateImage.isPending 
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  )
                  : referenceFile 
                    ? '🎨 Generate with Reference (gpt-image-1)' 
                    : '✨ Generate Image (dall-e-3)'
                }
              </button>
              
              {/* Loading Message */}
              {generateImage.isPending && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    🎨 Creating your image... This may take 30-60 seconds depending on complexity.
                  </p>
                </div>
              )}


              {generatedImageUrl && (
                <div>
                  <p className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Generated Image:</p>
                  <div className="relative w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 border border-slate-200 dark:border-slate-700">
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
                    className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {submitImage.isPending ? 'Submitting for Judgement...' : '📝 Submit for Judgement'}
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

