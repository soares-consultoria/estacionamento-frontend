import React from 'react';
import { usePlano } from '../hooks/usePlano';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  funcionalidade: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ funcionalidade, children, fallback }: FeatureGateProps) {
  const { temAcesso, plano } = usePlano();

  if (temAcesso(funcionalidade)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const planoNome: Record<string, string> = {
    ESSENCIAL: 'Essencial',
    PROFISSIONAL: 'Profissional',
    ENTERPRISE: 'Enterprise',
  };

  return (
    <div className="h-full flex items-center justify-center p-12">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Lock size={28} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Funcionalidade não disponível
        </h3>
        <p className="text-sm text-slate-500">
          Esta funcionalidade não está incluída no plano{' '}
          <strong>{planoNome[plano] ?? plano}</strong>.
          Entre em contato para fazer upgrade do seu plano.
        </p>
      </div>
    </div>
  );
}
