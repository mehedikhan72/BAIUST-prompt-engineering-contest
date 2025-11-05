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

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await api.delete(`/judge/teams/${teamId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['judge-teams'] });
      alert(`Team "${data.teamName}" has been deleted successfully.`);
    },
    onError: (error: any) => {
      alert(`Failed to delete team: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleDeleteTeam = (team: any) => {
    if (window.confirm(`Are you sure you want to delete "${team.teamName}"?\n\nThis will permanently remove:\n- Team account\n- All team progress\n- All submissions\n\nThis action cannot be undone.`)) {
      deleteTeam.mutate(team._id);
    }
  };

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
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTeam(team)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team)}
                    disabled={deleteTeam.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                  >
                    {deleteTeam.isPending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
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

