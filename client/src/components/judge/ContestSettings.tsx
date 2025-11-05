'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

function formatDateForInputGMT6(isoUtc?: string | null): string {
  if (!isoUtc) return '';
  const utc = new Date(isoUtc);
  if (isNaN(utc.getTime())) return '';
  // shift +6 hours
  const shifted = new Date(utc.getTime() + 6 * 60 * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mi = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toUtcIsoFromInputGMT6(input: string): string | null {
  if (!input) return null;
  // Parse yyyy-mm-ddThh:mm as a wall-clock time in GMT+6, independent of browser locale
  const [datePart, timePart] = input.split('T');
  if (!datePart || !timePart) return null;
  const [yStr, mStr, dStr] = datePart.split('-');
  const [hStr, minStr] = timePart.split(':');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const hour = Number(hStr);
  const minute = Number(minStr);
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;
  // Convert GMT+6 to UTC by subtracting 6 hours in UTC math
  const utcMs = Date.UTC(year, month - 1, day, hour - 6, minute, 0, 0);
  return new Date(utcMs).toISOString();
}

export default function ContestSettings() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['judge-contest'],
    queryFn: async () => {
      const res = await api.get('/judge/contest');
      return res.data.contest as { startTime: string; endTime: string; isActive?: boolean } | null;
    },
  });

  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [active, setActive] = useState(true);
  const [savingMsg, setSavingMsg] = useState('');

  useEffect(() => {
    setStartLocal(formatDateForInputGMT6(data?.startTime));
    setEndLocal(formatDateForInputGMT6(data?.endTime));
    setActive(data?.isActive ?? true);
  }, [data?.startTime, data?.endTime, data?.isActive]);

  const updateContest = useMutation({
    mutationFn: async (payload: { startTime: string; endTime: string; isActive: boolean }) => {
      const res = await api.put('/judge/contest', payload);
      return res.data;
    },
    onSuccess: () => {
      // refresh related queries
      queryClient.invalidateQueries({ queryKey: ['judge-contest'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['contest-info'] });
      setSavingMsg('Saved');
      setTimeout(() => setSavingMsg(''), 1500);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const startIso = toUtcIsoFromInputGMT6(startLocal);
    const endIso = toUtcIsoFromInputGMT6(endLocal);
    if (!startIso || !endIso) {
      alert('Please provide valid start and end times');
      return;
    }
    updateContest.mutate({ startTime: startIso, endTime: endIso, isActive: active });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contest Settings</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">All times shown as GMT+6</span>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Time (GMT+6)</label>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Time (GMT+6)</label>
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input id="isActive" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateContest.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {updateContest.isPending ? 'Saving...' : 'Save Settings'}
            </button>
            {savingMsg && <span className="text-sm text-emerald-600 dark:text-emerald-400 pt-2">{savingMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}


