import type {
  AdminCollaboratorLocation,
  EstadoLocalizacaoColaborador,
} from '../models/AdminCollaboratorMap';

/** Exibe a idade real da coleta, e não a hora em que o servidor respondeu. */
export function formatarIdadeLocalizacao(
  capturadaEm: string,
  agoraMs = Date.now(),
): string {
  const capturaMs = new Date(capturadaEm).getTime();
  if (!Number.isFinite(capturaMs)) return 'horário indisponível';
  const segundos = Math.max(0, Math.floor((agoraMs - capturaMs) / 1_000));
  if (segundos < 60) return 'agora';
  const minutos = Math.floor(segundos / 60);
  return minutos === 1 ? 'há 1 minuto' : `há ${minutos} minutos`;
}

export function formatarEstadoLocalizacao(
  estado: EstadoLocalizacaoColaborador,
): string {
  if (estado === 'atual') return 'Atual';
  if (estado === 'recente') return 'Recente';
  return 'Última posição';
}

export function obterIniciaisColaborador(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function descreverLocalizacaoColaborador(
  item: AdminCollaboratorLocation,
  agoraMs = Date.now(),
): string {
  const origem = item.origem === 'rota_monitorada'
    ? 'Recebida durante rota monitorada'
    : 'Recebida com o aplicativo aberto';
  const precisao = Math.round(item.precisaoMetros);
  return [
    item.setor || 'Setor não informado',
    `${formatarEstadoLocalizacao(item.estado)} · ${formatarIdadeLocalizacao(item.capturadaEm, agoraMs)}`,
    `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`,
    `Precisão aproximada: ${precisao} m`,
    origem,
    item.sessaoAtiva ? 'Sessão do aparelho ativa' : 'Sessão do aparelho encerrada',
  ].join('\n');
}
