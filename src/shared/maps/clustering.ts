import Supercluster from 'supercluster';
import type {LatLng, Region} from 'react-native-maps';

/*
 * O raio é medido em pixels do tile. O índice deixa de agrupar no zoom 18
 * para permitir a seleção individual de pontos muito próximos.
 */
const DEFAULT_CLUSTER_RADIUS = 32;
const DEFAULT_MAX_CLUSTER_ZOOM = 18;

/*
 * Inclui uma pequena área fora da tela para os marcadores não surgirem
 * abruptamente nas bordas durante o movimento do mapa.
 */
const DEFAULT_VIEWPORT_PADDING = 0.12;
const MAP_TILE_SIZE = 256;
const MIN_REGION_DELTA = 0.000_001;
const MIN_MAP_ZOOM = 0;
const MAX_MAP_ZOOM = 22;
const MAX_LATITUDE = 90;
const MAX_MERCATOR_LATITUDE = 85.051_128_78;
const CLUSTER_REGION_TOLERANCE_RATIO = 0.02;

interface MapPointProperties {
  itemKey: string;
}

interface CreateMapClusterIndexOptions<T> {
  items: readonly T[];
  getCoordinate: (item: T) => LatLng;
  getKey: (item: T) => string;
  radius?: number;
  maxZoom?: number;
}

interface GetMapClustersOptions {
  region: Region;
  viewportWidth: number;
  viewportHeight: number;
  viewportPadding?: number;
}

export interface MapCluster<T> {
  id: string;
  coordinate: LatLng;
  count: number;
  item: T | null;
  clusterId: number | null;
}

const normalizeLongitudeOffset = (offset: number): number => {
  if (offset > 180) return offset - 360;
  if (offset < -180) return offset + 360;

  return offset;
};

const clamp = (
  value: number,
  minimum: number,
  maximum: number,
): number =>
  Math.min(Math.max(value, minimum), maximum);

const toMercatorLatitude = (latitude: number): number => {
  const normalizedLatitude = clamp(
    latitude,
    -MAX_MERCATOR_LATITUDE,
    MAX_MERCATOR_LATITUDE,
  );
  const sinLatitude = Math.sin(
    normalizedLatitude * Math.PI / 180,
  );

  return (
    0.5 -
    Math.log((1 + sinLatitude) / (1 - sinLatitude)) /
      (4 * Math.PI)
  );
};

/**
 * Converte a região do React Native Maps para o nível inteiro de zoom usado
 * pelo Supercluster, considerando as dimensões reais do mapa na tela.
 */
const getMapZoom = ({
  region,
  viewportWidth,
  viewportHeight,
}: Omit<GetMapClustersOptions, 'viewportPadding'>): number => {
  const longitudeDelta = Math.max(
    Math.abs(region.longitudeDelta),
    MIN_REGION_DELTA,
  );
  const northMercator = toMercatorLatitude(
    region.latitude + Math.abs(region.latitudeDelta) / 2,
  );
  const southMercator = toMercatorLatitude(
    region.latitude - Math.abs(region.latitudeDelta) / 2,
  );
  const mercatorLatitudeDelta = Math.max(
    Math.abs(northMercator - southMercator),
    MIN_REGION_DELTA,
  );
  const horizontalZoom = Math.log2(
    (360 * Math.max(viewportWidth, 1)) /
      (longitudeDelta * MAP_TILE_SIZE),
  );
  const verticalZoom = Math.log2(
    Math.max(viewportHeight, 1) /
      (mercatorLatitudeDelta * MAP_TILE_SIZE),
  );

  return clamp(
    Math.floor(Math.min(horizontalZoom, verticalZoom)),
    MIN_MAP_ZOOM,
    MAX_MAP_ZOOM,
  );
};

/**
 * Transforma a região visível no bounding box esperado pelo Supercluster:
 * oeste, sul, leste e norte, sempre em longitude/latitude.
 */
const getBoundingBox = (
  region: Region,
  viewportPadding: number,
): [number, number, number, number] => {
  const paddingMultiplier = 1 + viewportPadding * 2;
  const latitudeRadius =
    Math.abs(region.latitudeDelta) *
    paddingMultiplier /
    2;
  const longitudeRadius =
    Math.abs(region.longitudeDelta) *
    paddingMultiplier /
    2;

  return [
    region.longitude - longitudeRadius,
    clamp(
      region.latitude - latitudeRadius,
      -MAX_LATITUDE,
      MAX_LATITUDE,
    ),
    region.longitude + longitudeRadius,
    clamp(
      region.latitude + latitudeRadius,
      -MAX_LATITUDE,
      MAX_LATITUDE,
    ),
  ];
};

const isValidCoordinate = (coordinate: LatLng): boolean =>
  Number.isFinite(coordinate.latitude) &&
  Number.isFinite(coordinate.longitude) &&
  coordinate.latitude >= -MAX_LATITUDE &&
  coordinate.latitude <= MAX_LATITUDE &&
  coordinate.longitude >= -180 &&
  coordinate.longitude <= 180;

/**
 * Compara regiões com tolerância pequena para evitar animações de câmera
 * redundantes sem bloquear movimentos intencionais do usuário.
 */
export const areRegionsClose = (
  first: Region | null | undefined,
  second: Region | null | undefined,
  tolerance = 0.000_01,
): boolean => {
  if (!first || !second) return false;

  return (
    Math.abs(first.latitude - second.latitude) <= tolerance &&
    Math.abs(
      normalizeLongitudeOffset(first.longitude - second.longitude),
    ) <= tolerance &&
    Math.abs(first.latitudeDelta - second.latitudeDelta) <= tolerance &&
    Math.abs(first.longitudeDelta - second.longitudeDelta) <= tolerance
  );
};

/**
 * Compara regiões com tolerância proporcional ao zoom atual. Isso evita
 * recalcular clusters por oscilações mínimas emitidas pelo mapa nativo.
 */
export const areClusterRegionsClose = (
  first: Region | null | undefined,
  second: Region | null | undefined,
): boolean => {
  if (!first || !second) return false;

  const latitudeTolerance = Math.max(
    MIN_REGION_DELTA,
    Math.abs(first.latitudeDelta) *
      CLUSTER_REGION_TOLERANCE_RATIO,
  );
  const longitudeTolerance = Math.max(
    MIN_REGION_DELTA,
    Math.abs(first.longitudeDelta) *
      CLUSTER_REGION_TOLERANCE_RATIO,
  );

  return (
    Math.abs(first.latitude - second.latitude) <= latitudeTolerance &&
    Math.abs(
      normalizeLongitudeOffset(first.longitude - second.longitude),
    ) <= longitudeTolerance &&
    Math.abs(first.latitudeDelta - second.latitudeDelta) <=
      latitudeTolerance &&
    Math.abs(first.longitudeDelta - second.longitudeDelta) <=
      longitudeTolerance
  );
};

/**
 * Adaptador genérico do Supercluster para os dados do aplicativo. O índice
 * espacial é criado por conjunto de itens e consultado por região e zoom.
 */
export class MapClusterIndex<T> {
  private readonly index: Supercluster<MapPointProperties>;

  private readonly itemsByKey = new Map<string, T>();

  /**
   * Converte itens válidos em pontos GeoJSON e carrega o índice espacial.
   * Chaves repetidas recebem um sufixo apenas dentro deste índice.
   */
  constructor({
    items,
    getCoordinate,
    getKey,
    radius = DEFAULT_CLUSTER_RADIUS,
    maxZoom = DEFAULT_MAX_CLUSTER_ZOOM,
  }: CreateMapClusterIndexOptions<T>) {
    this.index = new Supercluster<MapPointProperties>({
      radius,
      maxZoom,
      minPoints: 2,
      nodeSize: 64,
    });

    const keyOccurrences = new Map<string, number>();
    const features: Array<
      Supercluster.PointFeature<MapPointProperties>
    > = [];

    items.forEach(item => {
      const coordinate = getCoordinate(item);

      if (!isValidCoordinate(coordinate)) return;

      const baseKey = getKey(item);
      const occurrence = keyOccurrences.get(baseKey) ?? 0;
      const itemKey =
        occurrence === 0
          ? baseKey
          : `${baseKey}:${occurrence}`;

      keyOccurrences.set(baseKey, occurrence + 1);
      this.itemsByKey.set(itemKey, item);
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            coordinate.longitude,
            coordinate.latitude,
          ],
        },
        properties: {
          itemKey,
        },
      });
    });

    this.index.load(features);
  }

  /**
   * Retorna clusters e pontos individuais relevantes para a região visível.
   * Clusters possuem `clusterId`; pontos individuais possuem `item`.
   */
  getClusters({
    region,
    viewportWidth,
    viewportHeight,
    viewportPadding = DEFAULT_VIEWPORT_PADDING,
  }: GetMapClustersOptions): MapCluster<T>[] {
    const zoom = getMapZoom({
      region,
      viewportWidth,
      viewportHeight,
    });
    const features = this.index.getClusters(
      getBoundingBox(region, viewportPadding),
      zoom,
    );

    return features.reduce<MapCluster<T>[]>((clusters, feature) => {
      const [longitude, latitude] =
        feature.geometry.coordinates;
      const properties = feature.properties;

      if ('cluster' in properties && properties.cluster) {
        clusters.push({
          id: `cluster:${properties.cluster_id}`,
          coordinate: {latitude, longitude},
          count: properties.point_count,
          item: null,
          clusterId: properties.cluster_id,
        });

        return clusters;
      }

      const item = this.itemsByKey.get(properties.itemKey);

      if (!item) return clusters;

      clusters.push({
        id: `item:${properties.itemKey}`,
        coordinate: {latitude, longitude},
        count: 1,
        item,
        clusterId: null,
      });

      return clusters;
    }, []);
  }

  /**
   * Retorna o primeiro zoom em que o agrupamento selecionado se divide.
   */
  getClusterExpansionZoom(clusterId: number): number {
    return this.index.getClusterExpansionZoom(clusterId);
  }
}
