import type {LatLng} from 'react-native-maps';

export interface RoutePreview {
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
  distanceMeters: number;
  distanceKm: number;
  distanceText: string;
  encodedPolyline: string;
  coordinates: LatLng[];
}

export interface RoutePreviewApiResponse {
  durationSeconds?: number;
  durationMinutes: number;
  durationText: string;
  distanceMeters?: number;
  distanceKm: number;
  distanceText: string;
  encodedPolyline?: string;
}
