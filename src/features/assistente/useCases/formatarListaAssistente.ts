/** Mantém respostas visuais curtas sem perder a quantidade de itens omitidos. */
export const formatarListaAssistente = (
  itens: readonly string[],
  limite: number,
): string => {
  const visiveis = itens.slice(0, limite);
  const restantes = itens.length - visiveis.length;

  return `${visiveis.join(', ')}${restantes > 0 ? ` e mais ${restantes}` : ''}`;
};

