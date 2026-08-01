import * as Location from 'expo-location';
import type {LatLng} from 'react-native-maps';

import {appLogger} from '../../../shared/logging/appLogger';

/**
 * Identifica a cidade correspondente às coordenadas selecionadas no mapa.
 * Uma falha do serviço de geocodificação não bloqueia o cadastro do ponto.
 */
export async function identificarCidadePonto(
  coordenadas: LatLng,
): Promise<string | null> {
  try {
    const enderecos = await Location.reverseGeocodeAsync(coordenadas);
    const endereco = enderecos[0];

    return (
      endereco?.city?.trim() ||
      endereco?.subregion?.trim() ||
      null
    );
  } catch (error: unknown) {
    appLogger.error(
      'Erro ao identificar a cidade do ponto de interesse:',
      error,
    );

    return null;
  }
}
