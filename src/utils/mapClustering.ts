import type { LatLng, Region } from 'react-native-maps';

const DEFAULT_CELL_SIZE = 72;
const DEFAULT_VIEWPORT_PADDING = 0.12;
const MIN_REGION_DELTA = 0.000_001;

export interface MapCluster<T> {
  id: string;
  coordinate: LatLng;
  items: readonly T[];
}

interface ClusterMapItemsOptions<T> {
  items: readonly T[];
  region: Region;
  viewportWidth: number;
  viewportHeight: number;
  getCoordinate: (item: T) => LatLng;
  getKey: (item: T) => string;
  cellSize?: number;
  viewportPadding?: number;
}

const normalizeLongitudeOffset = (offset: number): number => {
  if (offset > 180) return offset - 360;
  if (offset < -180) return offset + 360;

  return offset;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const hashKeys = (keys: readonly string[]): string => {
  let hash = 2_166_136_261;

  keys.forEach(key => {
    for (let index = 0; index < key.length; index += 1) {
      hash ^= key.charCodeAt(index);
      hash = Math.imul(hash, 16_777_619);
    }
  });

  return (hash >>> 0).toString(36);
};

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

export const clusterMapItems = <T>({
  items,
  region,
  viewportWidth,
  viewportHeight,
  getCoordinate,
  getKey,
  cellSize = DEFAULT_CELL_SIZE,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
}: ClusterMapItemsOptions<T>): MapCluster<T>[] => {
  if (items.length === 0) return [];

  const latitudeDelta = Math.max(
    Math.abs(region.latitudeDelta),
    MIN_REGION_DELTA,
  );
  const longitudeDelta = Math.max(
    Math.abs(region.longitudeDelta),
    MIN_REGION_DELTA,
  );

  const paddedLatitudeDelta =
    latitudeDelta * (1 + viewportPadding * 2);
  const paddedLongitudeDelta =
    longitudeDelta * (1 + viewportPadding * 2);

  const columns = Math.max(
    1,
    Math.ceil(Math.max(viewportWidth, cellSize) / cellSize),
  );
  const rows = Math.max(
    1,
    Math.ceil(Math.max(viewportHeight, cellSize) / cellSize),
  );

  const cells = new Map<string, T[]>();

  items.forEach(item => {
    const coordinate = getCoordinate(item);
    const latitudeOffset = coordinate.latitude - region.latitude;
    const longitudeOffset = normalizeLongitudeOffset(
      coordinate.longitude - region.longitude,
    );

    if (
      Math.abs(latitudeOffset) > paddedLatitudeDelta / 2 ||
      Math.abs(longitudeOffset) > paddedLongitudeDelta / 2
    ) {
      return;
    }

    const horizontalPosition =
      longitudeOffset / paddedLongitudeDelta + 0.5;
    const verticalPosition =
      0.5 - latitudeOffset / paddedLatitudeDelta;

    const column = clamp(
      Math.floor(horizontalPosition * columns),
      0,
      columns - 1,
    );
    const row = clamp(
      Math.floor(verticalPosition * rows),
      0,
      rows - 1,
    );
    const cellKey = `${column}:${row}`;
    const cellItems = cells.get(cellKey);

    if (cellItems) {
      cellItems.push(item);
      return;
    }

    cells.set(cellKey, [item]);
  });

  return Array.from(cells.entries()).map(([cellKey, cellItems]) => {
    const coordinate = cellItems.reduce<LatLng>(
      (result, item) => {
        const itemCoordinate = getCoordinate(item);

        return {
          latitude: result.latitude + itemCoordinate.latitude,
          longitude: result.longitude + itemCoordinate.longitude,
        };
      },
      {latitude: 0, longitude: 0},
    );

    const keys = cellItems.map(getKey);

    return {
      id:
        cellItems.length === 1
          ? `item:${keys[0]}`
          : `cluster:${cellKey}:${cellItems.length}:${hashKeys(keys)}`,
      coordinate: {
        latitude: coordinate.latitude / cellItems.length,
        longitude: coordinate.longitude / cellItems.length,
      },
      items: cellItems,
    };
  });
};
