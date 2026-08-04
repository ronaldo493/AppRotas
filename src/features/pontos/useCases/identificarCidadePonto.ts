import type {LatLng} from 'react-native-maps';

import {resolverCidadePorCoordenadas} from '../../../core/location/services/locationSnapshotService';

/**
 * Identifica a cidade correspondente às coordenadas selecionadas no mapa.
 * Uma falha do serviço de geocodificação não bloqueia o cadastro do ponto.
 */
export async function identificarCidadePonto(
  coordenadas: LatLng,
): Promise<string | null> {
  return resolverCidadePorCoordenadas(coordenadas);
}
