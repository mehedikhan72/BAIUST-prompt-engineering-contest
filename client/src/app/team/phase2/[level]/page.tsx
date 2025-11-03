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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reference image for AI generation
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const referenceInputRef = useRef<HTMLInputElement>(null);

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
      const res = await api.post(`/team/phase2/${level}/generate`, { 
        prompt: promptText,
        referenceImageUrl: referenceImageUrl || undefined
      });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
    },
  });

  const uploadReferenceImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/team/phase2/${level}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setReferenceImageUrl(data.imageUrl);
      alert('✅ Reference image uploaded to CDN!\n\n💡 Tip: Wait 2-3 seconds before generating to ensure CDN propagation.');
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
      setUploadedFile(null);
      setPreviewUrl('');
      setReferenceFile(null);
      setReferencePreviewUrl('');
      setReferenceImageUrl('');
      router.push('/team');
    },
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/team/phase2/${level}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      setUploadedFile(null);
      setPreviewUrl('');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setUploadedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const latestSubmission = submissions?.[0];
  const canSubmit = !latestSubmission || 
    (latestSubmission.status === 'JUDGED' && latestSubmission.canResubmit);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {levelData?.name || `Phase 2 - Level ${level}`}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {levelData?.description || 'Reverse Prompt Engineering'}
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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reference Image & Assets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Reference Image & Assets</h3>
            {levelData?.referenceImage && (
              <div className="mb-4">
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
            {levelData?.assets && levelData.assets.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Assets to include:</p>
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
                          className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Asset {i + 1}: {asset.split('/').pop() || 'Download'}
                        </a>
                      );
                    }
                    
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
                        {asset}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Prompt & Generation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-slate-100">Your Prompt</h3>
            
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
              referenceImageUrl 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
            }`}>
              <h4 className={`text-sm font-semibold mb-2 ${
                referenceImageUrl 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {referenceImageUrl ? '✅ Reference Image Ready' : '💡 Optional: Upload Reference Image for AI'}
              </h4>
              <p className={`text-xs mb-3 ${
                referenceImageUrl 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {referenceImageUrl 
                  ? 'Your reference image is uploaded and ready! The AI will use gpt-image-1 to edit it based on your prompt.' 
                  : 'Upload a reference image to guide the AI generation (uses gpt-image-1 model)'
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
                disabled={!canSubmit || uploadReferenceImage.isPending}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => referenceFile && uploadReferenceImage.mutate(referenceFile)}
                      disabled={uploadReferenceImage.isPending || !referenceFile || !!referenceImageUrl}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload size={18} />
                      <span>{uploadReferenceImage.isPending ? 'Uploading...' : referenceImageUrl ? 'Uploaded ✓' : 'Upload Reference'}</span>
                    </button>
                    {referenceImageUrl && (
                      <button
                        onClick={() => {
                          setReferenceFile(null);
                          setReferencePreviewUrl('');
                          setReferenceImageUrl('');
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
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
                ? 'Generating with AI...' 
                : referenceImageUrl 
                  ? '🎨 Generate with Reference (gpt-image-1)' 
                  : '✨ Generate Image (dall-e-3)'
              }
            </button>

            {/* OR Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-medium">
                  Or upload your own
                </span>
              </div>
            </div>

            {/* Upload Image Section */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={!canSubmit}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon size={20} />
                <span>{uploadedFile ? uploadedFile.name : 'Choose Image'}</span>
              </button>

              {previewUrl && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">Preview:</p>
                  <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 border border-slate-200 dark:border-slate-700">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => uploadedFile && uploadImage.mutate(uploadedFile)}
                    disabled={uploadImage.isPending || !uploadedFile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={20} />
                    <span>{uploadImage.isPending ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                </div>
              )}
            </div>

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
                  disabled={submitImage.isPending}
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {submitImage.isPending ? 'Submitting...' : 'Submit for Judging'}
                </button>
              </div>
            )}
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

