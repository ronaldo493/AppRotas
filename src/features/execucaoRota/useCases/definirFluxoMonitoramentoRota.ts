import type {ResultadoConfiguracaoMonitoramento} from '../services/configuracaoMonitoramentoRotaApi';

export interface FluxoMonitoramentoRota {
  monitorar: boolean;
  exibirPrevia: boolean;
  configuracaoOffline: boolean;
}

/**
 * Mantém o monitoramento conhecido quando o servidor está offline, mas evita
 * uma tentativa de prévia que depende de rede e bloquearia o colaborador.
 */
export function definirFluxoMonitoramentoRota(
  configuration: ResultadoConfiguracaoMonitoramento,
): FluxoMonitoramentoRota {
  const monitorar = configuration.habilitado;

  return {
    monitorar,
    exibirPrevia:
      monitorar && configuration.origem === 'servidor',
    configuracaoOffline:
      configuration.origem === 'cache',
  };
}
