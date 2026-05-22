import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

// Exported so api.ts can read the token without causing re-renders
export const tokenRef: { current: string | null } = { current: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      setUser(JSON.parse(raw) as User);
    }
  }, []);

  const login = (authenticatedUser: User, jwt: string) => {
    setUser(authenticatedUser);
    setToken(jwt);
    tokenRef.current = jwt;
    const safeUser = { id: authenticatedUser.id, username: authenticatedUser.username };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('codetutor-fs-nodes');
  };

  const isAuthenticated = user !== null && tokenRef.current !== null;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
