import type {
  DestinoExecucaoRota,
  PontoRastreamento,
  VisitaDestinoRota,
} from '../models/ExecucaoRota';
import {calcularDistanciaMetros} from './calcularDistanciaRota';

const MAX_ACCEPTED_ACCURACY_METERS = 100;
const DESTINATION_RADIUS_METERS = 120;
const REQUIRED_CONSECUTIVE_POINTS = 3;
const MINIMUM_CONFIRMATION_SECONDS = 15;
const MAXIMUM_INTERVAL_SECONDS = 45;

interface DestinationCandidate {
  codigo: number;
  ordemPlanejada: number;
  consecutivePoints: number;
  firstPointAt: string | null;
  lastPointAt: string | null;
  visita: VisitaDestinoRota | null;
}

export interface ProgressoVisitaDestinoRota {
  codigo: number;
  ordemPlanejada: number;
  pontosConsecutivos: number;
  primeiroPontoEm: string | null;
  ultimoPontoEm: string | null;
  visita: VisitaDestinoRota | null;
}

const isUsablePoint = (
  point: PontoRastreamento,
): boolean =>
  Number.isFinite(point.latitude) &&
  Number.isFinite(point.longitude) &&
  point.latitude >= -90 &&
  point.latitude <= 90 &&
  point.longitude >= -180 &&
  point.longitude <= 180 &&
  (point.precisao === null ||
    point.precisao <= MAX_ACCEPTED_ACCURACY_METERS);

const createDestinationKey = (
  destination: DestinoExecucaoRota,
): string =>
  `${destination.ordem}:${destination.codigo}`;

/**
 * Confirma uma visita somente depois de leituras consecutivas próximas ao
 * destino. Isso reduz falsos positivos quando o veículo apenas passa na via.
 */
export function processarProgressoVisitasDestinos(
  pontos: readonly PontoRastreamento[],
  destinos: readonly DestinoExecucaoRota[],
  progressoAtual: readonly ProgressoVisitaDestinoRota[] = [],
): ProgressoVisitaDestinoRota[] {
  const candidates = new Map<
    string,
    DestinationCandidate
  >();
  let nextVisitOrder =
    progressoAtual.reduce(
      (maximum, progress) =>
        Math.max(
          maximum,
          progress.visita?.ordemVisita ?? 0,
        ),
      0,
    ) + 1;

  destinos.forEach(destination => {
    const previous = progressoAtual.find(
      progress =>
        progress.codigo === destination.codigo &&
        progress.ordemPlanejada ===
          destination.ordem,
    );

    candidates.set(createDestinationKey(destination), {
      codigo: destination.codigo,
      ordemPlanejada: destination.ordem,
      consecutivePoints:
        previous?.pontosConsecutivos ?? 0,
      firstPointAt:
        previous?.primeiroPontoEm ?? null,
      lastPointAt: previous?.ultimoPontoEm ?? null,
      visita: previous?.visita ?? null,
    });
  });

  const orderedPoints = pontos
    .filter(isUsablePoint)
    .sort(
      (first, second) =>
        new Date(first.registradoEm).getTime() -
        new Date(second.registradoEm).getTime(),
    );

  orderedPoints.forEach(point => {
    destinos.forEach(destination => {
      const key = createDestinationKey(destination);
      const existingCandidate = candidates.get(key);

      if (existingCandidate?.visita) return;

      const candidate = existingCandidate ?? {
        codigo: destination.codigo,
        ordemPlanejada: destination.ordem,
        consecutivePoints: 0,
        firstPointAt: null,
        lastPointAt: null,
        visita: null,
      };
      const distance = calcularDistanciaMetros(
        point,
        destination,
      );
      const acceptedRadius =
        point.precisao === null
          ? DESTINATION_RADIUS_METERS
          : Math.max(
              DESTINATION_RADIUS_METERS,
              point.precisao * 1.5,
            );

      if (distance > acceptedRadius) {
        candidates.set(key, {
          ...candidate,
          consecutivePoints: 0,
          firstPointAt: null,
          lastPointAt: null,
        });
        return;
      }

      const currentTime = new Date(
        point.registradoEm,
      ).getTime();
      const previousTime = candidate.lastPointAt
        ? new Date(candidate.lastPointAt).getTime()
        : null;
      const remainsConsecutive =
        previousTime !== null &&
        currentTime > previousTime &&
        (currentTime - previousTime) / 1_000 <=
          MAXIMUM_INTERVAL_SECONDS;
      const firstPointAt = remainsConsecutive
        ? candidate.firstPointAt
        : point.registradoEm;
      const consecutivePoints = remainsConsecutive
        ? candidate.consecutivePoints + 1
        : 1;
      const confirmationWindowSeconds = firstPointAt
        ? (currentTime -
            new Date(firstPointAt).getTime()) /
          1_000
        : 0;

      candidates.set(key, {
        ...candidate,
        consecutivePoints,
        firstPointAt,
        lastPointAt: point.registradoEm,
      });

      if (
        consecutivePoints <
          REQUIRED_CONSECUTIVE_POINTS ||
        confirmationWindowSeconds <
          MINIMUM_CONFIRMATION_SECONDS
      ) {
        return;
      }

      const visit: VisitaDestinoRota = {
        codigo: destination.codigo,
        ordemPlanejada: destination.ordem,
        ordemVisita: nextVisitOrder,
        confirmadoEm: point.registradoEm,
        latitudeConfirmacao: point.latitude,
        longitudeConfirmacao: point.longitude,
        distanciaConfirmacaoMetros:
          Math.round(distance),
      };

      candidates.set(key, {
        ...candidate,
        consecutivePoints,
        firstPointAt,
        lastPointAt: point.registradoEm,
        visita: visit,
      });
      nextVisitOrder += 1;
    });
  });

  return [...candidates.values()].map(candidate => ({
    codigo: candidate.codigo,
    ordemPlanejada: candidate.ordemPlanejada,
    pontosConsecutivos:
      candidate.consecutivePoints,
    primeiroPontoEm: candidate.firstPointAt,
    ultimoPontoEm: candidate.lastPointAt,
    visita: candidate.visita,
  }));
}

export function confirmarVisitasDestinos(
  pontos: readonly PontoRastreamento[],
  destinos: readonly DestinoExecucaoRota[],
): VisitaDestinoRota[] {
  return processarProgressoVisitasDestinos(
    pontos,
    destinos,
  )
    .flatMap(progress =>
      progress.visita ? [progress.visita] : [],
    )
    .sort(
    (first, second) =>
      first.ordemVisita - second.ordemVisita,
  );
}
