import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState {
  try {
    const token = localStorage.getItem('tf_token');
    const raw = localStorage.getItem('tf_user');
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch {}
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(user));
    setState({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setState({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
