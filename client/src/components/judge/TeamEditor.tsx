'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function TeamEditor() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [newTeam, setNewTeam] = useState({
    email: '',
    password: '',
    teamName: '',
    participants: [{ name: '', email: '' }, { name: '', email: '' }]
  });

  const { data: teams } = useQuery({
    queryKey: ['judge-teams'],
    queryFn: async () => {
      const res = await api.get('/judge/teams');
      return res.data.teams;
    },
  });

  const createTeam = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/judge/teams', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-teams'] });
      setShowCreateForm(false);
      setNewTeam({
        email: '',
        password: '',
        teamName: '',
        participants: [{ name: '', email: '' }, { name: '', email: '' }]
      });
    },
  });

  const updateTeam = useMutation({
    mutationFn: async (data: any) => {
      const { _id, ...updateData } = data;
      const res = await api.put(`/judge/teams/${_id}`, updateData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judge-teams'] });
      setEditingTeam(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Teams</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Create Team
          </button>
        </div>

        <div className="space-y-4">
          {teams?.map((team: any) => (
            <div key={team._id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{team.teamName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{team.email}</p>
                  {team.participants && team.participants.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">Participants:</p>
                      {team.participants.map((p: any, i: number) => (
                        <p key={i} className="text-gray-600 dark:text-gray-400 ml-2">
                          {p.name} ({p.email})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingTeam(team)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Team</h3>
            <form onSubmit={(e) => { e.preventDefault(); createTeam.mutate(newTeam); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={newTeam.email}
                  onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={newTeam.password}
                  onChange={(e) => setNewTeam({ ...newTeam, password: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeam.teamName}
                  onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Participant 1</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newTeam.participants[0].name}
                  onChange={(e) => setNewTeam({ 
                    ...newTeam, 
                    participants: [
                      { ...newTeam.participants[0], name: e.target.value },
                      newTeam.participants[1]
                    ]
                  })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newTeam.participants[0].email}
                  onChange={(e) => setNewTeam({ 
                    ...newTeam, 
                    participants: [
                      { ...newTeam.participants[0], email: e.target.value },
                      newTeam.participants[1]
                    ]
                  })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Participant 2</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newTeam.participants[1].name}
                  onChange={(e) => setNewTeam({ 
                    ...newTeam, 
                    participants: [
                      newTeam.participants[0],
                      { ...newTeam.participants[1], name: e.target.value }
                    ]
                  })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newTeam.participants[1].email}
                  onChange={(e) => setNewTeam({ 
                    ...newTeam, 
                    participants: [
                      newTeam.participants[0],
                      { ...newTeam.participants[1], email: e.target.value }
                    ]
                  })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createTeam.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {createTeam.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Team</h3>
            <form onSubmit={(e) => { e.preventDefault(); updateTeam.mutate(editingTeam); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Team Name</label>
                <input
                  type="text"
                  required
                  value={editingTeam.teamName}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateTeam.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {updateTeam.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
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

