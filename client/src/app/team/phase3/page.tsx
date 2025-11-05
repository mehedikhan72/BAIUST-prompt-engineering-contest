'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Phase3Page() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [description, setDescription] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'TEAM') {
      router.push('/');
    }
  }, [user, router]);

  const { data: submissions } = useQuery({
    queryKey: ['phase3-submissions'],
    queryFn: async () => {
      const res = await api.get('/team/submissions');
      return res.data.submissions.filter((s: any) => s.phaseNumber === 3);
    },
  });

  const { data: contest } = useQuery({
    queryKey: ['contest-info'],
    queryFn: async () => {
      const res = await api.get('/leaderboard');
      return res.data.contest as { startTime: string; endTime: string } | null;
    },
    refetchInterval: 10000,
  });

  const submitPhase3 = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/team/phase3/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      alert('Phase 3 submission sent for judging!');
      setDescription('');
      setApiEndpoint('');
      setFiles(null);
      router.push('/team');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('description', description);
    formData.append('apiEndpoint', apiEndpoint);
    
    if (files) {
      Array.from(files).forEach((file, i) => {
        formData.append(`file${i}`, file);
      });
    }
    
    submitPhase3.mutate(formData);
  };

  const latestSubmission = submissions?.[0];
  const contestEnded = !!contest && Date.now() >= new Date(contest.endTime).getTime();
  const canSubmit = (!latestSubmission || 
    (latestSubmission.status === 'JUDGED' && latestSubmission.canResubmit)) && !contestEnded;

  const { data: levelData } = useQuery({
    queryKey: ['phase3-level'],
    queryFn: async () => {
      const res = await api.get(`/team/phases/3/levels`);
      return res.data.levels.find((l: any) => l.levelNumber === 1);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {levelData?.name || 'Phase 3'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {levelData?.description || 'Build-Your-Own RAG System'}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {/* Phase 3 Instructions & PDF Download */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📖 Phase 3: Build Your RAG System</h3>
          
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>Download the provided PDF document below</li>
              <li>Build a RAG (Retrieval-Augmented Generation) system using this document</li>
              <li>Implement document parsing, chunking, embedding, and retrieval</li>
              <li>Create a question-answering system that can query the document</li>
              <li>Upload your code, documentation, and provide API endpoint if deployed</li>
            </ol>
          </div>

          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  📄 Required Document
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                  Download this PDF document to build your RAG system. This will be your knowledge base.
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <span>📋 Format: PDF</span>
                  <span>•</span>
                  <span>🔒 Required for Phase 3</span>
                  <span>•</span>
                  <span>⚡ Use for document retrieval</span>
                </div>
              </div>
              <div className="ml-4">
                <a
                  href="/book.pdf"
                  download="rag-document.pdf"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          </div>

          <div className="mb-6 grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-900 dark:text-slate-100 font-semibold mb-2">🔍 Document Processing</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Parse PDF, extract text, chunk content for embedding</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-900 dark:text-slate-100 font-semibold mb-2">🧠 Vector Storage</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Create embeddings, store in vector database for similarity search</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-900 dark:text-slate-100 font-semibold mb-2">💬 Q&A System</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Implement retrieval + generation pipeline for answering questions</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📤 Submit Your RAG System</h3>

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
                Resubmission not allowed. Score: {latestSubmission.judgeScore}/10
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description of Your Approach
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your RAG system architecture, retrieval strategy, and design choices..."
                rows={8}
                required
                disabled={!canSubmit}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                API Endpoint (Optional)
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://your-rag-api.example.com"
                disabled={!canSubmit}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Provide if you've deployed your RAG system
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Upload Files (Code, Documentation, PDFs)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                disabled={!canSubmit}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Upload source code, documentation, or any supporting materials
              </p>
            </div>

            {files && files.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Selected Files ({files.length}):
                </p>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  {Array.from(files).map((file, i) => (
                    <li key={i}>
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={submitPhase3.isPending || !canSubmit}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitPhase3.isPending ? 'Submitting...' : 'Submit for Judging'}
            </button>
          </form>
        </div>

        {/* Previous Submissions */}
        {submissions && submissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Previous Submissions</h3>
            <div className="space-y-4">
              {submissions.map((sub: any) => {
                let content;
                try {
                  content = JSON.parse(sub.content);
                } catch {
                  content = { description: sub.content };
                }

                return (
                  <div key={sub._id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
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
                            {sub.judgeScore}/10
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {sub.canResubmit ? 'Can resubmit' : 'No resubmission'}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {content.description}
                    </p>
                    {sub.files && sub.files.length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {sub.files.length} file(s) uploaded
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

