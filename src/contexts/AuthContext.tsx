import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/axios';

export interface AuthUser {
  nome: string;
  email: string;
  role: string;
  instituicaoId: number;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem('auth');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<{
      token: string;
      tipo: string;
      nome: string;
      email: string;
      role: string;
      instituicao_id: number;
      expiracao_ms: number;
    }>('/api/auth/login', { email, senha });

    const authUser: AuthUser = {
      nome: data.nome,
      email: data.email,
      role: data.role,
      instituicaoId: data.instituicao_id,
      token: data.token,
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('auth', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
