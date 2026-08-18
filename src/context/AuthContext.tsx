import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthUser, GymAccess, PermissionCode } from '../types/api';
import { hasPermission } from '../types/api';
import { authService } from '../services/auth/authService';
import { tokenStorage } from '../services/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  user: AuthUser | null;
  gymAccessList: GymAccess[];
  currentGym: GymAccess | null;
  error: string | null;
  login: (username: string, password: string) => Promise<{ token: string | null; gyms: GymAccess[] }>;
  logout: () => void;
  setCurrentGym: (gym: GymAccess) => void;
  clearError: () => void;
  refreshGyms: () => Promise<void>;
  can: (code: PermissionCode) => boolean;
  gymId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [gymAccessList, setGymAccessList] = useState<GymAccess[]>([]);
  const [currentGym, setCurrentGymState] = useState<GymAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = authService.getStoredSession();
    if (session.access) {
      setIsAuthenticated(true);
      setToken(session.access);
      setUser(session.user);
      setGymAccessList(session.gyms);
      setCurrentGymState(session.currentGym);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const r = await authService.login(username, password);
      setIsAuthenticated(true);
      setToken(r.access);
      setUser(r.user);
      setGymAccessList(r.gyms);
      setCurrentGymState(r.gyms[0] || null);
      return { token: r.access, gyms: r.gyms };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
      setIsAuthenticated(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear UI state immediately; fire-and-forget server logout
    void authService.logout();
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setGymAccessList([]);
    setCurrentGymState(null);
    setError(null);
  }, []);

  const setCurrentGym = useCallback((gym: GymAccess) => {
    setCurrentGymState(gym);
    authService.persistCurrentGym(gym);
  }, []);

  const refreshGyms = useCallback(async () => {
    try {
      const gyms = await authService.fetchMyGyms();
      setGymAccessList(gyms);
      if (!gyms.length) { setCurrentGymState(null); return; }
      setCurrentGymState((prev) => {
        if (prev) {
          const s = gyms.find((g) => g.gym === prev.gym);
          if (s) return s;
        }
        authService.persistCurrentGym(gyms[0]);
        return gyms[0];
      });
    } catch { /* keep */ }
  }, []);

  const can = useCallback(
    (code: PermissionCode) => {
      if (!currentGym) return false;
      return hasPermission(String(currentGym.role), undefined, code);
    },
    [currentGym],
  );

  const gymId = currentGym?.gym ?? null;

  const value = useMemo(
    () => ({
      isAuthenticated, loading, token, user, gymAccessList, currentGym, error,
      login, logout, setCurrentGym, clearError: () => setError(null), refreshGyms, can, gymId,
    }),
    [isAuthenticated, loading, token, user, gymAccessList, currentGym, error, login, logout, setCurrentGym, refreshGyms, can, gymId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
