'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PhaseEditor() {
  const queryClient = useQueryClient();
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

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

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/judge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setEditingLevel({ ...editingLevel, referenceImage: res.data.url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAsset(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/judge/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return res.data.url;
      });

      const urls = await Promise.all(uploadPromises);
      const currentAssets = editingLevel.assets || [];
      setEditingLevel({ ...editingLevel, assets: [...currentAssets, ...urls] });
    } catch (error) {
      alert('Failed to upload assets');
    } finally {
      setUploadingAsset(false);
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
                      Reference Image
                    </label>
                    {editingLevel.referenceImage && (
                      <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {editingLevel.referenceImage}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceImageUpload}
                        disabled={uploading}
                        className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploading && <span className="text-sm text-gray-500 py-2">Uploading...</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Or paste URL directly:
                    </p>
                    <input
                      type="text"
                      value={editingLevel.referenceImage || ''}
                      onChange={(e) => setEditingLevel({ ...editingLevel, referenceImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Assets
                    </label>
                    {editingLevel.assets && editingLevel.assets.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {editingLevel.assets.map((asset: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">
                              {asset}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newAssets = editingLevel.assets.filter((_: string, idx: number) => idx !== i);
                                setEditingLevel({ ...editingLevel, assets: newAssets });
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        multiple
                        onChange={handleAssetUpload}
                        disabled={uploadingAsset}
                        className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingAsset && <span className="text-sm text-gray-500 py-2">Uploading...</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Or enter URLs/text (comma-separated):
                    </p>
                    <input
                      type="text"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const newAssets = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                          const currentAssets = editingLevel.assets || [];
                          setEditingLevel({ ...editingLevel, assets: [...currentAssets, ...newAssets] });
                          e.target.value = '';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          if (input.value) {
                            const newAssets = input.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                            const currentAssets = editingLevel.assets || [];
                            setEditingLevel({ ...editingLevel, assets: [...currentAssets, ...newAssets] });
                            input.value = '';
                          }
                        }
                      }}
                      placeholder="cat, dog, tree or https://..."
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mt-1"
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

