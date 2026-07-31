import type {
  CoordenadaRota,
  DestinoExecucaoRota,
  OcorrenciaLocalizacaoRota,
  PontoRastreamento,
  ResumoExecucaoRota,
} from '../models/ExecucaoRota';
import {decodeGooglePolyline} from '../../../shared/maps/polyline';
import {calcularDistanciaMetros} from './calcularDistanciaRota';
import {confirmarVisitasDestinos} from './confirmarVisitasDestinos';

const EARTH_RADIUS_METERS = 6_371_000;
const MAX_ACCEPTED_ACCURACY_METERS = 100;
const MAX_GAP_COUNTED_SECONDS = 120;
const MAX_PLAUSIBLE_SPEED_METERS_SECOND = 60;
const DEVIATION_DISTANCE_METERS = 100;
const DEVIATION_CONFIRMATION_POINTS = 3;
const ROUTE_RETURN_DISTANCE_METERS = 60;
const ROUTE_RETURN_CONFIRMATION_POINTS = 2;
const toRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

export {calcularDistanciaMetros} from './calcularDistanciaRota';

const isValidCoordinate = (
  coordinate: CoordenadaRota,
): boolean =>
  Number.isFinite(coordinate.latitude) &&
  Number.isFinite(coordinate.longitude) &&
  coordinate.latitude >= -90 &&
  coordinate.latitude <= 90 &&
  coordinate.longitude >= -180 &&
  coordinate.longitude <= 180;

const isUsablePoint = (
  point: PontoRastreamento,
): boolean =>
  isValidCoordinate(point) &&
  (point.precisao === null ||
    point.precisao <= MAX_ACCEPTED_ACCURACY_METERS);

/**
 * Decodifica o formato de polyline utilizado pelas APIs de rotas do Google.
 */
export function decodificarPolyline(
  encodedPolyline: string | null,
): CoordenadaRota[] {
  return decodeGooglePolyline(encodedPolyline);
}

const encodeValue = (value: number): string => {
  let shiftedValue = value < 0
    ? ~(value << 1)
    : value << 1;
  let encoded = '';

  while (shiftedValue >= 0x20) {
    encoded += String.fromCharCode(
      (0x20 | (shiftedValue & 0x1f)) + 63,
    );
    shiftedValue >>= 5;
  }

  return encoded + String.fromCharCode(shiftedValue + 63);
};

/**
 * Compacta o caminho realizado para armazenamento no backend e no aparelho.
 */
export function codificarPolyline(
  coordinates: readonly CoordenadaRota[],
): string | null {
  if (coordinates.length === 0) return null;

  let lastLatitude = 0;
  let lastLongitude = 0;

  return coordinates
    .map(coordinate => {
      const latitude = Math.round(
        coordinate.latitude * 100_000,
      );
      const longitude = Math.round(
        coordinate.longitude * 100_000,
      );
      const encoded =
        encodeValue(latitude - lastLatitude) +
        encodeValue(longitude - lastLongitude);

      lastLatitude = latitude;
      lastLongitude = longitude;

      return encoded;
    })
    .join('');
}

const distanceToSegmentMeters = (
  point: CoordenadaRota,
  start: CoordenadaRota,
  end: CoordenadaRota,
): number => {
  const referenceLatitude = toRadians(point.latitude);
  const metersPerLongitudeDegree =
    (Math.PI / 180) *
    EARTH_RADIUS_METERS *
    Math.cos(referenceLatitude);
  const metersPerLatitudeDegree =
    (Math.PI / 180) * EARTH_RADIUS_METERS;
  const startX =
    (start.longitude - point.longitude) *
    metersPerLongitudeDegree;
  const startY =
    (start.latitude - point.latitude) *
    metersPerLatitudeDegree;
  const endX =
    (end.longitude - point.longitude) *
    metersPerLongitudeDegree;
  const endY =
    (end.latitude - point.latitude) *
    metersPerLatitudeDegree;
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSquared =
    segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    return Math.hypot(startX, startY);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      -(
        startX * segmentX +
        startY * segmentY
      ) / segmentLengthSquared,
    ),
  );

  return Math.hypot(
    startX + projection * segmentX,
    startY + projection * segmentY,
  );
};

const distanceToRouteMeters = (
  point: CoordenadaRota,
  route: readonly CoordenadaRota[],
): number | null => {
  if (route.length < 2) return null;

  let shortestDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < route.length; index += 1) {
    shortestDistance = Math.min(
      shortestDistance,
      distanceToSegmentMeters(
        point,
        route[index - 1],
        route[index],
      ),
    );
  }

  return Number.isFinite(shortestDistance)
    ? shortestDistance
    : null;
};

const calculateDeviationCount = (
  points: readonly PontoRastreamento[],
  plannedRoute: readonly CoordenadaRota[],
): number | null => {
  if (plannedRoute.length < 2) return null;

  let deviations = 0;
  let outsideCount = 0;
  let returnCount = 0;
  let isOutsideRoute = false;

  points.forEach(point => {
    const distance = distanceToRouteMeters(
      point,
      plannedRoute,
    );

    if (distance === null) return;

    if (!isOutsideRoute) {
      outsideCount =
        distance > DEVIATION_DISTANCE_METERS
          ? outsideCount + 1
          : 0;

      if (
        outsideCount >=
        DEVIATION_CONFIRMATION_POINTS
      ) {
        deviations += 1;
        isOutsideRoute = true;
        outsideCount = 0;
      }

      return;
    }

    returnCount =
      distance < ROUTE_RETURN_DISTANCE_METERS
        ? returnCount + 1
        : 0;

    if (
      returnCount >=
      ROUTE_RETURN_CONFIRMATION_POINTS
    ) {
      isOutsideRoute = false;
      returnCount = 0;
    }
  });

  return deviations;
};

const calculateVisitedDestinations = (
  points: readonly PontoRastreamento[],
  destinations: readonly DestinoExecucaoRota[],
): {
  destinosVisitados: number[];
  ordemDestinosVisitados: number[];
  detalhesDestinosVisitados: ReturnType<
    typeof confirmarVisitasDestinos
  >;
  chegadaDestinoFinalEm: string | null;
  conclusaoConfirmadaEm: string | null;
  destinosConfirmadosPorGps: boolean;
} => {
  const visits = confirmarVisitasDestinos(
    points,
    destinations,
  );

  const finalDestination = [...destinations].sort(
    (first, second) => second.ordem - first.ordem,
  )[0];
  const finalVisit = finalDestination
    ? visits.find(
        visit =>
          visit.codigo === finalDestination.codigo &&
          visit.ordemPlanejada ===
            finalDestination.ordem,
      )
    : null;
  const completionVisit = [...visits].sort(
    (first, second) =>
      new Date(second.confirmadoEm).getTime() -
      new Date(first.confirmadoEm).getTime(),
  )[0];

  return {
    destinosVisitados: [...visits]
      .sort(
        (first, second) =>
          first.ordemPlanejada -
          second.ordemPlanejada,
      )
      .map(visit => visit.codigo),
    ordemDestinosVisitados: visits.map(
      visit => visit.codigo,
    ),
    detalhesDestinosVisitados: visits,
    chegadaDestinoFinalEm:
      finalVisit?.confirmadoEm ?? null,
    conclusaoConfirmadaEm:
      completionVisit?.confirmadoEm ?? null,
    destinosConfirmadosPorGps:
      destinations.length > 0 &&
      visits.length === destinations.length,
  };
};

interface CalcularMetricasInput {
  pontos: readonly PontoRastreamento[];
  destinos: readonly DestinoExecucaoRota[];
  iniciadaEm: string;
  finalizadaEm: string;
  trajetoPlanejado: string | null;
  ocorrenciasLocalizacao?: readonly OcorrenciaLocalizacaoRota[];
}

/**
 * Consolida os pontos válidos em indicadores. Lacunas longas não são
 * classificadas como tempo parado, pois não existe evidência suficiente.
 */
export function calcularMetricasExecucaoRota({
  pontos,
  destinos,
  iniciadaEm,
  finalizadaEm,
  trajetoPlanejado,
  ocorrenciasLocalizacao = [],
}: CalcularMetricasInput): ResumoExecucaoRota {
  const usablePoints = pontos
    .filter(isUsablePoint)
    .sort(
      (first, second) =>
        new Date(first.registradoEm).getTime() -
        new Date(second.registradoEm).getTime(),
    );
  let traveledDistance = 0;
  let movingSeconds = 0;
  let stoppedSeconds = 0;
  let noSignalSeconds = 0;

  for (
    let index = 1;
    index < usablePoints.length;
    index += 1
  ) {
    const previous = usablePoints[index - 1];
    const current = usablePoints[index];
    const intervalSeconds =
      (new Date(current.registradoEm).getTime() -
        new Date(previous.registradoEm).getTime()) /
      1000;

    if (intervalSeconds <= 0) continue;

    if (intervalSeconds > MAX_GAP_COUNTED_SECONDS) {
      noSignalSeconds += intervalSeconds;
      continue;
    }

    const segmentDistance = calcularDistanciaMetros(
      previous,
      current,
    );
    const accuracyTolerance =
      (previous.precisao ?? 0) +
      (current.precisao ?? 0) +
      40;
    const maximumPlausibleDistance =
      intervalSeconds *
        MAX_PLAUSIBLE_SPEED_METERS_SECOND +
      accuracyTolerance;

    if (segmentDistance > maximumPlausibleDistance) {
      continue;
    }

    const measuredSpeed =
      current.velocidade !== null &&
      current.velocidade >= 0
        ? current.velocidade
        : segmentDistance / intervalSeconds;
    const gpsNoiseTolerance = Math.max(
      5,
      Math.min(
        30,
        ((previous.precisao ?? 10) +
          (current.precisao ?? 10)) /
          2,
      ),
    );

    if (measuredSpeed >= 1.5) {
      traveledDistance += segmentDistance;
      movingSeconds += intervalSeconds;
    } else {
      /*
       * Pequenos deslocamentos abaixo da margem de precisão são oscilação do
       * GPS, não distância realmente percorrida.
       */
      if (segmentDistance > gpsNoiseTolerance) {
        traveledDistance += segmentDistance;
      }

      stoppedSeconds += intervalSeconds;
    }
  }

  const plannedRoute =
    decodificarPolyline(trajetoPlanejado);
  const visited =
    calculateVisitedDestinations(
      usablePoints,
      destinos,
    );
  const totalSeconds = Math.max(
    0,
    Math.round(
      (new Date(finalizadaEm).getTime() -
        new Date(iniciadaEm).getTime()) /
        1000,
    ),
  );
  const durationToFinalDestinationSeconds =
    visited.chegadaDestinoFinalEm
      ? Math.max(
          0,
          Math.round(
            (new Date(
              visited.chegadaDestinoFinalEm,
            ).getTime() -
              new Date(iniciadaEm).getTime()) /
              1000,
          ),
        )
      : null;
  const unavailableLocationSeconds =
    ocorrenciasLocalizacao.reduce(
      (total, occurrence) =>
        total +
        Math.max(
          0,
          occurrence.duracaoSegundos ?? 0,
        ),
      0,
    );

  return {
    distanciaPercorridaMetros:
      Math.round(traveledDistance),
    duracaoTotalSegundos: totalSeconds,
    tempoMovimentoSegundos:
      Math.round(movingSeconds),
    tempoParadoSegundos:
      Math.round(stoppedSeconds),
    duracaoSemSinalSegundos:
      Math.round(noSignalSeconds),
    quantidadeDesvios:
      calculateDeviationCount(
        usablePoints,
        plannedRoute,
      ),
    quantidadePontos: usablePoints.length,
    quantidadeDestinosPlanejados:
      destinos.length,
    quantidadeDestinosVisitados:
      visited.destinosVisitados.length,
    destinosVisitados:
      visited.destinosVisitados,
    ordemDestinosVisitados:
      visited.ordemDestinosVisitados,
    detalhesDestinosVisitados:
      visited.detalhesDestinosVisitados,
    chegadaDestinoFinalEm:
      visited.chegadaDestinoFinalEm,
    conclusaoConfirmadaEm:
      visited.conclusaoConfirmadaEm,
    duracaoAteDestinoFinalSegundos:
      durationToFinalDestinationSeconds,
    destinosConfirmadosPorGps:
      visited.destinosConfirmadosPorGps,
    rotaConfirmadaPorGps:
      visited.destinosConfirmadosPorGps &&
      ocorrenciasLocalizacao.length === 0,
    teveInterrupcaoLocalizacao:
      ocorrenciasLocalizacao.length > 0,
    quantidadeInterrupcoesLocalizacao:
      ocorrenciasLocalizacao.length,
    duracaoLocalizacaoIndisponivelSegundos:
      Math.round(unavailableLocationSeconds),
    ocorrenciasLocalizacao: [
      ...ocorrenciasLocalizacao,
    ],
    trajetoReal: codificarPolyline(usablePoints),
  };
}
