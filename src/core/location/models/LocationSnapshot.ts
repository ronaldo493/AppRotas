export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface CapturedLocation {
  coordinates: LocationCoordinates;
  accuracyMeters: number | null;
  capturedAt: string;
}

/**
 * Mantém cidade e coordenadas vinculadas à mesma leitura do aparelho.
 * Registros de auditoria não devem combinar GPS atual com cidade antiga da UI.
 */
export interface LocationSnapshot extends CapturedLocation {
  city: string | null;
}
