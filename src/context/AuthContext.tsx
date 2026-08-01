import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { LoginResult } from '../services/authService';
import { GymStaffAccess } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  gymAccessList: GymStaffAccess[];
  currentGym: GymStaffAccess | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ token: string | null; gyms: GymStaffAccess[] }>;
  logout: () => void;
  setCurrentGym: (gym: GymStaffAccess) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fitopia_auth_token';
const GYMS_KEY = 'fitopia_gym_access';
const CURRENT_GYM_KEY = 'fitopia_current_gym';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [gymAccessList, setGymAccessList] = useState<GymStaffAccess[]>([]);
  const [currentGym, setCurrentGymState] = useState<GymStaffAccess | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on app startup
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedGymsStr = localStorage.getItem(GYMS_KEY);
      const storedCurrentGymStr = localStorage.getItem(CURRENT_GYM_KEY);

      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);

        if (storedGymsStr) {
          try {
            const gyms: GymStaffAccess[] = JSON.parse(storedGymsStr);
            setGymAccessList(gyms);

            if (storedCurrentGymStr) {
              setCurrentGymState(JSON.parse(storedCurrentGymStr));
            } else if (gyms.length > 0) {
              setCurrentGymState(gyms[0]);
            }
          } catch (e) {
            console.error('Failed to parse stored gyms:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const result: LoginResult = await authService.login(username, password);

      const activeToken = result.token || `session_${Date.now()}`;
      setToken(activeToken);
      setIsAuthenticated(true);
      setGymAccessList(result.gyms || []);

      localStorage.setItem(TOKEN_KEY, activeToken);
      localStorage.setItem(GYMS_KEY, JSON.stringify(result.gyms || []));

      if (result.gyms && result.gyms.length > 0) {
        const selected = result.gyms[0];
        setCurrentGymState(selected);
        localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(selected));
      } else {
        setCurrentGymState(null);
        localStorage.removeItem(CURRENT_GYM_KEY);
      }

      return { token: activeToken, gyms: result.gyms };
    } catch (err: any) {
      const msg = err.message || 'خطایی در برقراری ارتباط رخ داد.';
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setIsAuthenticated(false);
    setGymAccessList([]);
    setCurrentGymState(null);
    setError(null);
  };

  const setCurrentGym = (gym: GymStaffAccess) => {
    setCurrentGymState(gym);
    localStorage.setItem(CURRENT_GYM_KEY, JSON.stringify(gym));
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        gymAccessList,
        currentGym,
        loading,
        error,
        login,
        logout,
        setCurrentGym,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
