import type {
  PeriodoPainelAdmin,
  SituacaoExecucaoAdmin,
} from '../models/AdminRouteDashboard';

const ROTULOS_SITUACAO: Record<SituacaoExecucaoAdmin, string> = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  concluida_parcial: 'Parcial',
  cancelada: 'Cancelada',
  interrompida: 'Interrompida',
};

const ROTULOS_MOTIVO: Record<string, string> = {
  concluida_automaticamente: 'Conclusão confirmada automaticamente',
  cancelada_abertura_navegador: 'Navegação externa não iniciada',
  interrompida_usuario: 'Interrompida pelo colaborador',
  interrompida_logout: 'Interrompida ao sair do aplicativo',
  interrompida_erro: 'Interrompida após uma falha',
  interrompida_inatividade: 'Encerrada por inatividade',
};

/** Produz o intervalo local exibido no filtro e o envia em UTC ao backend. */
export const criarIntervaloPeriodoAdmin = (
  periodo: PeriodoPainelAdmin,
  agora = new Date(),
): {inicio: string; fim: string} => {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  if (periodo === '7_dias') inicio.setDate(inicio.getDate() - 6);
  if (periodo === '30_dias') inicio.setDate(inicio.getDate() - 29);

  return {inicio: inicio.toISOString(), fim: agora.toISOString()};
};

export const formatarSituacaoAdmin = (
  situacao: SituacaoExecucaoAdmin,
): string => ROTULOS_SITUACAO[situacao] ?? situacao;

export const formatarMotivoFinalizacaoAdmin = (
  motivo: string | null,
): string | null => motivo ? ROTULOS_MOTIVO[motivo] ?? motivo : null;

export const formatarDistanciaAdmin = (metros: number | null): string => {
  if (metros === null || !Number.isFinite(metros) || metros < 0) return '—';
  if (metros < 1_000) return `${Math.round(metros)} m`;

  return `${(metros / 1_000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
};

export const formatarDuracaoAdmin = (segundos: number | null): string => {
  if (segundos === null || !Number.isFinite(segundos) || segundos < 0) {
    return '—';
  }

  const totalMinutos = Math.round(segundos / 60);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  if (horas === 0) return `${minutos} min`;
  return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
};

export const formatarDataHoraAdmin = (valor: string | null): string => {
  if (!valor) return '—';
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return '—';

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
