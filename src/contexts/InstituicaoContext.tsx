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
  const canSelectInstituicao = user?.role === 'SUPER_ADMIN' || user?.role === 'SISTEMA_ADMIN';

  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const stored = localStorage.getItem('selectedInstituicaoId');
  const [selectedId, setSelectedIdState] = useState<number | null>(stored ? Number(stored) : null);

  useEffect(() => {
    if (!canSelectInstituicao) return;
    adminApi.listInstituicoes().then(list => {
      const ativas = list.filter(i => i.ativo);
      setInstituicoes(ativas);
      if (ativas.length > 0) {
        const isValid = selectedId !== null && ativas.some(i => i.id === selectedId);
        if (!isValid) {
          const fallback = ativas[0].id;
          setSelectedIdState(fallback);
          localStorage.setItem('selectedInstituicaoId', String(fallback));
        }
      }
    });
  }, [canSelectInstituicao]);

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
