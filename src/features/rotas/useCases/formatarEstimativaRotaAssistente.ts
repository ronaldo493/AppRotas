import type {RoutePreview} from '../models/RoutePreview';

export interface DescricaoEstimativaRotaAssistente {
  visual: string;
  falada: string;
}

const pluralizar = (valor: number, singular: string, plural: string): string =>
  `${valor} ${valor === 1 ? singular : plural}`;

/**
 * Mantém a escrita compacta na interface e entrega uma frase completa ao TTS,
 * evitando leituras artificiais como "dois h vinte e oito min".
 */
export const formatarEstimativaRotaAssistente = (
  preview: Pick<RoutePreview, 'durationSeconds' | 'distanceMeters'>,
): DescricaoEstimativaRotaAssistente => {
  const minutosTotais = Math.max(
    1,
    Math.round(preview.durationSeconds / 60),
  );
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  const duracaoVisual = horas > 0
    ? `${horas} h${minutos > 0 ? ` ${minutos} min` : ''}`
    : `${minutos} min`;
  const partesFaladas = [
    horas > 0 ? pluralizar(horas, 'hora', 'horas') : '',
    minutos > 0 ? pluralizar(minutos, 'minuto', 'minutos') : '',
  ].filter(Boolean);
  const duracaoFalada = partesFaladas.join(' e ');
  const distanciaKm = preview.distanceMeters / 1_000;
  const distanciaVisual = distanciaKm < 10
    ? `${distanciaKm.toFixed(1).replace('.', ',')} km`
    : `${Math.round(distanciaKm)} km`;
  const distanciaFalada = distanciaKm < 10
    ? `${distanciaKm.toFixed(1).replace('.', ',')} quilômetros`
    : pluralizar(Math.round(distanciaKm), 'quilômetro', 'quilômetros');

  return {
    visual:
      `O trajeto estimado tem ${distanciaVisual} e leva cerca de ${duracaoVisual}.`,
    falada:
      `O trajeto estimado tem ${distanciaFalada} e leva cerca de ${duracaoFalada}.`,
  };
};
