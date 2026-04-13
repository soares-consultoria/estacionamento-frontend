import { useAuth } from './useAuth';

export function usePlano() {
  const { user } = useAuth();

  const plano = user?.plano ?? 'ESSENCIAL';
  const funcionalidades = user?.funcionalidades ?? [];

  const temAcesso = (codigoFuncionalidade: string): boolean => {
    if (user?.role === 'SISTEMA_ADMIN' || user?.role === 'SUPER_ADMIN') return true;
    return funcionalidades.includes(codigoFuncionalidade);
  };

  const isProfissionalOuSuperior = plano === 'PROFISSIONAL' || plano === 'ENTERPRISE';
  const isEnterprise = plano === 'ENTERPRISE';

  return {
    plano,
    funcionalidades,
    temAcesso,
    isProfissionalOuSuperior,
    isEnterprise,
  };
}
