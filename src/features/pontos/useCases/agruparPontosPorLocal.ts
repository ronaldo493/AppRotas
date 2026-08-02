import type {LatLng} from 'react-native-maps';

const EARTH_RADIUS_METERS = 6_371_000;
const DEFAULT_GROUP_RADIUS_METERS = 12;

export interface PontoComLocalizacao {
  coordinate: LatLng;
  uniqueKey: string;
}

export interface GrupoPontosPorLocal<T extends PontoComLocalizacao> {
  coordinate: LatLng;
  pontos: T[];
  uniqueKey: string;
}

const toRadians = (degrees: number): number =>
  degrees * Math.PI / 180;

/**
 * Calcula a distancia entre duas coordenadas sem depender do mapa nativo.
 * A aproximacao de Haversine e suficiente para os poucos metros usados aqui.
 */
const calcularDistanciaMetros = (
  origem: LatLng,
  destino: LatLng,
): number => {
  const latitudeDelta = toRadians(
    destino.latitude - origem.latitude,
  );
  const longitudeDelta = toRadians(
    destino.longitude - origem.longitude,
  );
  const origemLatitude = toRadians(origem.latitude);
  const destinoLatitude = toRadians(destino.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(origemLatitude) *
      Math.cos(destinoLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    )
  );
};

/**
 * Consolida registros posicionados no mesmo estabelecimento em um unico local
 * clicavel. O agrupamento ocorre apenas quando os dados mudam e evita markers
 * sobrepostos que seriam impossiveis de selecionar individualmente.
 */
export function agruparPontosPorLocal<
  T extends PontoComLocalizacao,
>(
  pontos: readonly T[],
  raioMetros = DEFAULT_GROUP_RADIUS_METERS,
): GrupoPontosPorLocal<T>[] {
  const grupos: Array<{coordinate: LatLng; pontos: T[]}> = [];

  pontos.forEach(ponto => {
    const grupoExistente = grupos.find(
      grupo =>
        calcularDistanciaMetros(
          grupo.coordinate,
          ponto.coordinate,
        ) <= raioMetros,
    );

    if (grupoExistente) {
      grupoExistente.pontos.push(ponto);
      return;
    }

    grupos.push({
      coordinate: ponto.coordinate,
      pontos: [ponto],
    });
  });

  return grupos.map(grupo => ({
    ...grupo,
    uniqueKey: `local:${grupo.pontos
      .map(ponto => ponto.uniqueKey)
      .sort()
      .join('|')}`,
  }));
}
