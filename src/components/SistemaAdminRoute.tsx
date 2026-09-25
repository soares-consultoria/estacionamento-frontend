import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { ReactNode } from 'react';

/**
 * Guarda de rota exclusiva de SISTEMA_ADMIN. Além de exigir autenticação, redireciona
 * para a home quem não for SISTEMA_ADMIN — evita expor a "casca" das telas de preview
 * (Inteligência) para outros perfis. Os dados já são protegidos no backend (403).
 */
export default function SistemaAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SISTEMA_ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
}
