type OuvinteCapturaVoz = () => void;

const ouvintes = new Set<OuvinteCapturaVoz>();
const ouvintesDisponibilidade = new Set<() => void>();
let capturaDisponivel = false;

/**
 * Permite que integrações pequenas solicitem a captura de voz sem importar o
 * estado interno da assistente nem acoplar a tela ao seu orquestrador.
 */
export const solicitarCapturaVozAssistente = (): boolean => {
  if (ouvintes.size === 0) return false;
  ouvintes.forEach(ouvinte => ouvinte());
  return true;
};

export const observarCapturaVozAssistente = (
  ouvinte: OuvinteCapturaVoz,
): (() => void) => {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
};

/** Publica a flag já resolvida pelo ponto global, sem repetir chamadas HTTP. */
export const definirDisponibilidadeCapturaVoz = (
  disponivel: boolean,
): void => {
  if (capturaDisponivel === disponivel) return;
  capturaDisponivel = disponivel;
  ouvintesDisponibilidade.forEach(notificar => notificar());
};

export const obterDisponibilidadeCapturaVoz = (): boolean =>
  capturaDisponivel;

export const observarDisponibilidadeCapturaVoz = (
  notificar: () => void,
): (() => void) => {
  ouvintesDisponibilidade.add(notificar);
  return () => ouvintesDisponibilidade.delete(notificar);
};
