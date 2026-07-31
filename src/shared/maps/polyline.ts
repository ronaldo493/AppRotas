import type {LatLng} from 'react-native-maps';

/**
 * Decodifica uma polyline no formato utilizado pelas APIs do Google.
 * Retorna uma lista vazia quando o valor estiver ausente ou incompleto.
 */
export function decodeGooglePolyline(
  encodedPolyline: string | null | undefined,
): LatLng[] {
  if (!encodedPolyline) return [];

  const coordinates: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const decodeValue = (): number | null => {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (index >= encodedPolyline.length) {
        return null;
      }

      byte =
        encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    return result & 1
      ? ~(result >> 1)
      : result >> 1;
  };

  while (index < encodedPolyline.length) {
    const latitudeDelta = decodeValue();
    const longitudeDelta = decodeValue();

    if (
      latitudeDelta === null ||
      longitudeDelta === null
    ) {
      return [];
    }

    latitude += latitudeDelta;
    longitude += longitudeDelta;

    coordinates.push({
      latitude: latitude / 100_000,
      longitude: longitude / 100_000,
    });
  }

  return coordinates;
}
