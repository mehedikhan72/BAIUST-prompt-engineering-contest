import { create } from 'zustand';
import { getUser, getToken, setToken as saveToken, setUser as saveUser, removeToken } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  role: 'JUDGE' | 'TEAM';
  teamName?: string;
  participants?: Array<{ name: string; email: string }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (token: string, user: User) => {
    saveToken(token);
    saveUser(user);
    set({ token, user });
  },
  logout: () => {
    removeToken();
    set({ token: null, user: null });
  },
  initAuth: () => {
    const token = getToken();
    const user = getUser();
    if (token && user) {
      set({ token, user });
    }
  },
}));

