import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
