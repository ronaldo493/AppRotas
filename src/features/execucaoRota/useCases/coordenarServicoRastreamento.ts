export interface AdaptadorServicoRastreamento {
  estaAtivo: () => Promise<boolean>;
  iniciar: () => Promise<void>;
  parar: () => Promise<void>;
}

export interface ConfiguracaoCoordenadorRastreamento {
  atrasosRetentativaMs: readonly number[];
  intervaloAposParadaMs: number;
}

interface DependenciasTemporaisRastreamento {
  agora: () => number;
  aguardar: (tempoMs: number) => Promise<void>;
}

const CONFIGURACAO_PADRAO: ConfiguracaoCoordenadorRastreamento = {
  atrasosRetentativaMs: [750, 1_500],
  intervaloAposParadaMs: 1_200,
};

const DEPENDENCIAS_TEMPORAIS_PADRAO: DependenciasTemporaisRastreamento = {
  agora: Date.now,
  aguardar: tempoMs =>
    new Promise(resolve => setTimeout(resolve, tempoMs)),
};

/**
 * Tenta iniciar o serviço e confirma o estado nativo após cada tentativa.
 * O Android pode rejeitar a chamada enquanto conclui uma parada anterior ou
 * pode ativar o serviço apesar de a Promise nativa responder com erro.
 */
export async function iniciarServicoRastreamentoComRetentativa(
  adaptador: AdaptadorServicoRastreamento,
  configuracao: ConfiguracaoCoordenadorRastreamento = CONFIGURACAO_PADRAO,
  dependenciasTemporais: DependenciasTemporaisRastreamento =
    DEPENDENCIAS_TEMPORAIS_PADRAO,
): Promise<void> {
  let ultimoErro: unknown = null;
  const totalTentativas =
    configuracao.atrasosRetentativaMs.length + 1;

  for (
    let tentativa = 0;
    tentativa < totalTentativas;
    tentativa += 1
  ) {
    try {
      if (await adaptador.estaAtivo()) return;
    } catch (error: unknown) {
      ultimoErro = error;
    }

    try {
      await adaptador.iniciar();
    } catch (error: unknown) {
      ultimoErro = error;
    }

    try {
      if (await adaptador.estaAtivo()) return;
    } catch (error: unknown) {
      ultimoErro = error;
    }

    const atraso =
      configuracao.atrasosRetentativaMs[tentativa];

    if (atraso !== undefined && atraso > 0) {
      await dependenciasTemporais.aguardar(atraso);
    }
  }

  if (ultimoErro instanceof Error) {
    throw ultimoErro;
  }

  throw new Error(
    'O serviço de localização não confirmou a inicialização.',
  );
}

export interface CoordenadorServicoRastreamento {
  iniciar: () => Promise<void>;
  parar: () => Promise<void>;
}

/**
 * Serializa início e parada do serviço nativo. Isso impede que uma nova rota
 * tente iniciar o GPS enquanto o Android ainda encerra a rota anterior.
 */
export function criarCoordenadorServicoRastreamento(
  adaptador: AdaptadorServicoRastreamento,
  configuracao: ConfiguracaoCoordenadorRastreamento = CONFIGURACAO_PADRAO,
  dependenciasTemporais: DependenciasTemporaisRastreamento =
    DEPENDENCIAS_TEMPORAIS_PADRAO,
): CoordenadorServicoRastreamento {
  let fila: Promise<void> = Promise.resolve();
  let ultimaParadaEm: number | null = null;

  const enfileirar = <T>(operacao: () => Promise<T>): Promise<T> => {
    const resultado = fila.then(operacao, operacao);
    fila = resultado.then(
      () => undefined,
      () => undefined,
    );
    return resultado;
  };

  return {
    iniciar: () =>
      enfileirar(async () => {
        if (ultimaParadaEm !== null) {
          const tempoDecorrido =
            dependenciasTemporais.agora() - ultimaParadaEm;
          const tempoRestante =
            configuracao.intervaloAposParadaMs -
            tempoDecorrido;

          if (tempoRestante > 0) {
            await dependenciasTemporais.aguardar(
              tempoRestante,
            );
          }
        }

        await iniciarServicoRastreamentoComRetentativa(
          adaptador,
          configuracao,
          dependenciasTemporais,
        );
      }),
    parar: () =>
      enfileirar(async () => {
        if (!(await adaptador.estaAtivo())) return;

        await adaptador.parar();
        ultimaParadaEm = dependenciasTemporais.agora();
      }),
  };
}
