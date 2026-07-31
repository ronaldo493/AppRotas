import {getCoordinates} from '../../../shared/maps/coordinates';
import type {Filial} from '../../filiais/models/Filial';
import type {
  DestinoExecucaoRota,
  TipoDestinoRota,
} from '../models/ExecucaoRota';

/**
 * Converte a lista usada pela interface em um retrato imutável dos destinos
 * que será preservado durante toda a execução da rota.
 */
export function converterFiliaisEmDestinos(
  rotas: readonly Filial[],
  tipo: TipoDestinoRota,
): DestinoExecucaoRota[] {
  return rotas.map((rota, index) => {
    const coordenadas = getCoordinates(rota);

    if (!coordenadas) {
      throw new Error(
        `O destino ${rota.nomefilial} não possui coordenadas válidas.`,
      );
    }

    return {
      codigo: rota.codigofilial,
      nome: rota.nomefilial,
      cidade: rota.nomecidade,
      ordem: index + 1,
      tipo,
      ...coordenadas,
    };
  });
}
