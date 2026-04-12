import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { adminApi, type Instituicao } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface InstituicaoContextValue {
  instituicoes: Instituicao[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}

export const InstituicaoContext = createContext<InstituicaoContextValue>({
  instituicoes: [],
  selectedId: null,
  setSelectedId: () => {},
});

export function InstituicaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const stored = localStorage.getItem('selectedInstituicaoId');
  const [selectedId, setSelectedIdState] = useState<number | null>(stored ? Number(stored) : null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    adminApi.listInstituicoes().then(list => {
      const ativas = list.filter(i => i.ativo);
      setInstituicoes(ativas);
      if (ativas.length > 0 && selectedId === null) {
        setSelectedIdState(ativas[0].id);
      }
    });
  }, [isSuperAdmin]);

  const setSelectedId = useCallback((id: number) => {
    setSelectedIdState(id);
    localStorage.setItem('selectedInstituicaoId', String(id));
  }, []);

  return (
    <InstituicaoContext.Provider value={{ instituicoes, selectedId, setSelectedId }}>
      {children}
    </InstituicaoContext.Provider>
  );
}
