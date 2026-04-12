import { useContext } from 'react';
import { InstituicaoContext } from '../contexts/InstituicaoContext';

export function useInstituicao() {
  return useContext(InstituicaoContext);
}
