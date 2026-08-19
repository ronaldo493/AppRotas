import type {
  AdminActiveRouteLocation,
  EstadoAtualizacaoRotaAtiva,
} from '../models/AdminActiveRoutesMap';

/** Exibe a idade da coleta GPS, sem sugerir que o aparelho está online. */
export function formatarIdadeLocalizacao(
  capturadaEm: string | null,
  agoraMs = Date.now(),
): string {
  if (!capturadaEm) return 'aguardando localização';
  const capturaMs = new Date(capturadaEm).getTime();
  if (!Number.isFinite(capturaMs)) return 'horário indisponível';
  const segundos = Math.max(0, Math.floor((agoraMs - capturaMs) / 1_000));
  if (segundos < 60) return 'agora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return minutos === 1 ? 'há 1 minuto' : `há ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
}

export function formatarInicioRota(iniciadaEm: string): string {
  const date = new Date(iniciadaEm);
  if (!Number.isFinite(date.getTime())) return 'horário de início indisponível';
  return `Iniciada às ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function formatarEstadoRotaAtiva(
  estado: EstadoAtualizacaoRotaAtiva,
): string {
  if (estado === 'atual') return 'Recebendo localização';
  if (estado === 'atrasada') return 'Atualização atrasada';
  if (estado === 'sem_atualizacao') return 'Sem atualização recente';
  return 'Aguardando primeiro lote';
}

export function obterIniciaisColaborador(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function descreverRotaAtiva(
  item: AdminActiveRouteLocation,
  agoraMs = Date.now(),
): string {
  const destinos = item.quantidadeDestinosPlanejados > 0
    ? `${item.quantidadeDestinosVisitados} de ${item.quantidadeDestinosPlanejados} destinos confirmados`
    : 'Destinos ainda não informados';
  return [
    item.setor || 'Setor não informado',
    formatarInicioRota(item.iniciadaEm),
    `${formatarEstadoRotaAtiva(item.estado)} · ${formatarIdadeLocalizacao(item.capturadaEm, agoraMs)}`,
    `${item.quantidadePontos} ${item.quantidadePontos === 1 ? 'leitura recebida' : 'leituras recebidas'}`,
    destinos,
  ].join(' · ');
}
