export type AcaoGlobalDisponivel = 'assistente' | 'sugestao';

/**
 * Mantém a regra de substituição explícita e testável. Somente `true` vindo da
 * configuração habilita a assistente; qualquer ausência usa a sugestão.
 */
export function definirAcaoGlobal(
  assistenteHabilitada: boolean | null | undefined,
): AcaoGlobalDisponivel {
  return assistenteHabilitada === true
    ? 'assistente'
    : 'sugestao';
}
