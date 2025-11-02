'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PhaseEditor() {
  const queryClient = useQueryClient();
  const [editingLevel, setEditingLevel] = useState<any>(null);

  const { data: levels } = useQuery({
    queryKey: ['judge-levels'],
    queryFn: async () => {
      const res = await api.get('/judge/levels');
      return res.data.levels;
    },
  });

  const updateLevel = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/judge/levels/${data.phaseNumber}/${data.levelNumber}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-levels'] });
      setEditingLevel(null);
    },
  });

  const handleSaveLevel = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingLevel) {
      updateLevel.mutate(editingLevel);
    }
  };

  const groupedLevels = levels?.reduce((acc: any, level: any) => {
    if (!acc[level.phaseNumber]) {
      acc[level.phaseNumber] = [];
    }
    acc[level.phaseNumber].push(level);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Phases & Levels</h2>

        {groupedLevels && Object.entries(groupedLevels).map(([phaseNum, phaseLevels]: any) => (
          <div key={phaseNum} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Phase {phaseNum}
            </h3>
            <div className="grid gap-4">
              {phaseLevels.map((level: any) => (
                <div key={level._id} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Level {level.levelNumber}: {level.name || 'Unnamed'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {level.description || 'No description'}
                      </p>
                      {level.referenceImage && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Reference Image: {level.referenceImage}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingLevel(level)}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Level {editingLevel.phaseNumber}.{editingLevel.levelNumber}
            </h3>
            <form onSubmit={handleSaveLevel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Level Name
                </label>
                <input
                  type="text"
                  value={editingLevel.name || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={editingLevel.description || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              {editingLevel.phaseNumber === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Reference Image URL
                    </label>
                    <input
                      type="text"
                      value={editingLevel.referenceImage || ''}
                      onChange={(e) => setEditingLevel({ ...editingLevel, referenceImage: e.target.value })}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Assets (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editingLevel.assets?.join(', ') || ''}
                      onChange={(e) => setEditingLevel({ ...editingLevel, assets: e.target.value.split(',').map((s: string) => s.trim()) })}
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Max Score
                </label>
                <input
                  type="number"
                  value={editingLevel.maxScore || 10}
                  onChange={(e) => setEditingLevel({ ...editingLevel, maxScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateLevel.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {updateLevel.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

