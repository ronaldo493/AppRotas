export type ResultadoEsperaAssistente<T> =
  | {status: 'concluido'; valor: T}
  | {status: 'falha'}
  | {status: 'tempo_esgotado'};

/**
 * Limita somente a espera da interface. A requisição original continua em
 * segundo plano e ainda pode preencher o cache compartilhado para a próxima
 * tentativa.
 */
export const aguardarDadosAssistente = <T>(
  promessa: Promise<T>,
  limiteMs: number,
): Promise<ResultadoEsperaAssistente<T>> =>
  new Promise(resolve => {
    let concluido = false;
    const timer = setTimeout(() => {
      if (concluido) return;
      concluido = true;
      resolve({status: 'tempo_esgotado'});
    }, limiteMs);

    void promessa.then(
      valor => {
        if (concluido) return;
        concluido = true;
        clearTimeout(timer);
        resolve({status: 'concluido', valor});
      },
      () => {
        if (concluido) return;
        concluido = true;
        clearTimeout(timer);
        resolve({status: 'falha'});
      },
    );
  });
