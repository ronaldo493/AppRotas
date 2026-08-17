import type {
  AlertaOperacionalRotaAdmin,
  ConfiabilidadeRotaAdmin,
  ExecucaoRotaAdmin,
  PeriodoPainelAdmin,
  ResultadoViagemRotaAdmin,
  SituacaoExecucaoAdmin,
  StatusOperacionalRotaAdmin,
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

const ROTULOS_STATUS_OPERACIONAL: Record<StatusOperacionalRotaAdmin, string> = {
  rastreando: 'Recebendo localização',
  aguardando_dados: 'Aguardando novas leituras',
  sem_atualizacao: 'Sem atualização recente',
  sincronizacao_atrasada: 'Dados recebidos com atraso',
  finalizacao_pendente: 'Destino confirmado; finalização pendente',
  concluida_integral: 'Percurso integral confirmado',
  concluida_com_interrupcao: 'Percurso com lacunas',
  encerrada: 'Percurso encerrado',
};

const ROTULOS_CONFIABILIDADE: Record<ConfiabilidadeRotaAdmin, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  indeterminada: 'Em análise',
};

const ROTULOS_ALERTA: Record<AlertaOperacionalRotaAdmin, string> = {
  destino_confirmado_finalizacao_pendente:
    'O GPS confirmou os destinos, mas o encerramento ainda não foi consolidado.',
  sem_atualizacao:
    'O servidor não recebe uma atualização desta rota há pelo menos 15 minutos.',
  somente_ponto_inicial:
    'Até agora, somente a leitura inicial está disponível.',
  evidencia_insuficiente:
    'Não existem leituras suficientes para comprovar que o percurso foi realizado.',
  destino_nao_confirmado:
    'Há um trajeto registrado, mas nenhuma chegada foi confirmada por GPS.',
  velocidade_incompativel:
    'A velocidade média calculada é incompatível com uma viagem rodoviária; confira o trajeto no mapa.',
  sincronizacao_atrasada:
    'Parte do trajeto chegou ao servidor com atraso superior a 5 minutos.',
  localizacao_interrompida:
    'O aparelho registrou uma interrupção na coleta de localização.',
};

const ROTULOS_RESULTADO_VIAGEM: Record<ResultadoViagemRotaAdmin, string> = {
  em_acompanhamento: 'Em acompanhamento',
  percorrida_confirmada: 'Percurso confirmado',
  percorrida_parcial: 'Percurso parcial',
  interrompida_com_trajeto: 'Interrompida com trajeto',
  interrompida_sem_trajeto: 'Interrompida sem trajeto suficiente',
  trajeto_sem_visita_confirmada: 'Trajeto sem visita confirmada',
  sem_evidencia_suficiente: 'Evidência insuficiente',
  nao_iniciada: 'Percurso não iniciado',
};

const ROTULOS_ORIGEM_FINALIZACAO: Record<string, string> = {
  aplicativo: 'Aplicativo',
  servidor_destino_confirmado: 'Servidor após confirmação do destino',
  servidor_inatividade: 'Servidor por inatividade',
  servidor_troca_dispositivo: 'Servidor por troca de aparelho',
};

export const MAXIMO_DIAS_PERIODO_ADMIN = 31;

const inicioDoDia = (data: Date): Date => {
  const resultado = new Date(data);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
};

const fimDoDia = (data: Date): Date => {
  const resultado = new Date(data);
  resultado.setHours(23, 59, 59, 999);
  return resultado;
};

/** Retorna as datas locais correspondentes aos atalhos do filtro. */
export const criarDatasPeriodoAdmin = (
  periodo: PeriodoPainelAdmin,
  agora = new Date(),
): {dataInicial: Date; dataFinal: Date} => {
  const dataInicial = inicioDoDia(agora);
  if (periodo === '7_dias') dataInicial.setDate(dataInicial.getDate() - 6);
  if (periodo === '30_dias') dataInicial.setDate(dataInicial.getDate() - 29);

  return {dataInicial, dataFinal: inicioDoDia(agora)};
};

/**
 * Converte o período escolhido para UTC. Dias anteriores são consultados por
 * inteiro; quando o fim é hoje, a consulta termina no horário atual.
 */
export const criarIntervaloDatasAdmin = (
  dataInicial: Date,
  dataFinal: Date,
  agora = new Date(),
): {inicio: string; fim: string} => {
  const inicio = inicioDoDia(dataInicial);
  const fimSelecionado = fimDoDia(dataFinal);
  const fim = fimSelecionado.getTime() > agora.getTime()
    ? new Date(agora)
    : fimSelecionado;

  if (inicio.getTime() > fim.getTime()) {
    throw new Error('A data inicial não pode ser posterior à data final.');
  }

  const limite = new Date(inicio);
  limite.setDate(limite.getDate() + MAXIMO_DIAS_PERIODO_ADMIN);
  if (fim.getTime() >= limite.getTime()) {
    throw new Error(`O período máximo é de ${MAXIMO_DIAS_PERIODO_ADMIN} dias.`);
  }

  return {inicio: inicio.toISOString(), fim: fim.toISOString()};
};

/** Produz o intervalo local exibido no filtro e o envia em UTC ao backend. */
export const criarIntervaloPeriodoAdmin = (
  periodo: PeriodoPainelAdmin,
  agora = new Date(),
): {inicio: string; fim: string} => {
  const {dataInicial, dataFinal} = criarDatasPeriodoAdmin(periodo, agora);
  return criarIntervaloDatasAdmin(dataInicial, dataFinal, agora);
};

export const formatarSituacaoAdmin = (
  situacao: SituacaoExecucaoAdmin,
): string => ROTULOS_SITUACAO[situacao] ?? situacao;

export const formatarMotivoFinalizacaoAdmin = (
  motivo: string | null,
): string | null => motivo ? ROTULOS_MOTIVO[motivo] ?? motivo : null;

export const formatarStatusOperacionalAdmin = (
  status: StatusOperacionalRotaAdmin | undefined,
): string | null => status ? ROTULOS_STATUS_OPERACIONAL[status] ?? status : null;

export const formatarConfiabilidadeAdmin = (
  confiabilidade: ConfiabilidadeRotaAdmin | undefined,
): string => confiabilidade
  ? ROTULOS_CONFIABILIDADE[confiabilidade] ?? confiabilidade
  : 'Não calculada';

export const formatarAlertaOperacionalAdmin = (
  alerta: AlertaOperacionalRotaAdmin,
): string => ROTULOS_ALERTA[alerta] ?? alerta;

export const formatarOrigemFinalizacaoAdmin = (
  origem: string | null | undefined,
): string => origem
  ? ROTULOS_ORIGEM_FINALIZACAO[origem] ?? origem
  : 'Não informada';

export const formatarResultadoViagemAdmin = (
  resultado: ResultadoViagemRotaAdmin | undefined,
  situacaoFallback?: SituacaoExecucaoAdmin,
): string => resultado
  ? ROTULOS_RESULTADO_VIAGEM[resultado] ?? resultado
  : situacaoFallback
    ? formatarSituacaoAdmin(situacaoFallback)
    : 'Resultado não calculado';

/**
 * Explica a classificação da viagem em linguagem operacional, sem concluir
 * que uma visita ocorreu quando as evidências de GPS são insuficientes.
 */
export const descreverExecucaoRotaAdmin = (
  execucao: ExecucaoRotaAdmin,
): string => {
  const planejados =
    execucao.quantidadeDestinosPlanejados ??
    execucao.destinos.length;
  const visitados =
    execucao.quantidadeDestinosVisitados ?? 0;
  const pontos = execucao.quantidadePontos ?? 0;

  switch (execucao.resultadoViagem) {
    case 'em_acompanhamento':
      if (execucao.statusOperacional === 'sem_atualizacao') {
        return 'A rota continua aberta, mas o servidor não recebe novas informações há pelo menos 15 minutos.';
      }
      if (execucao.statusOperacional === 'finalizacao_pendente') {
        return 'Os destinos foram confirmados pelo GPS e a rota aguarda o encerramento definitivo.';
      }
      if (execucao.statusOperacional === 'aguardando_dados') {
        return 'A rota foi aberta e ainda aguarda novas leituras de localização.';
      }
      return 'A rota está aberta e continua recebendo informações de localização.';
    case 'percorrida_confirmada':
      return `O GPS registrou o trajeto e confirmou ${visitados} de ${planejados} destinos planejados.`;
    case 'percorrida_parcial':
      return `O aparelho registrou deslocamento, mas confirmou somente ${visitados} de ${planejados} destinos.`;
    case 'interrompida_com_trajeto':
      return `A rota foi interrompida após registrar ${pontos} leituras de localização. O trecho percorrido está disponível no mapa.`;
    case 'interrompida_sem_trajeto':
      return 'A rota foi interrompida sem leituras suficientes para comprovar o deslocamento.';
    case 'trajeto_sem_visita_confirmada':
      return 'Houve deslocamento registrado, mas o GPS não confirmou a chegada a nenhum destino.';
    case 'sem_evidencia_suficiente':
      return `O encerramento foi registrado com apenas ${pontos} ${pontos === 1 ? 'leitura' : 'leituras'} de localização.`;
    case 'nao_iniciada':
      return 'A navegação foi preparada, mas não existem evidências de que o percurso tenha começado.';
    default:
      return 'As informações disponíveis ainda não permitem resumir o resultado desta viagem.';
  }
};

export const formatarVelocidadeAdmin = (
  velocidadeKmH: number | null | undefined,
): string => velocidadeKmH !== null
  && velocidadeKmH !== undefined
  && Number.isFinite(velocidadeKmH)
  && velocidadeKmH >= 0
  ? `${velocidadeKmH.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} km/h`
  : '—';

export const formatarTempoRelativoAdmin = (
  segundos: number | null | undefined,
): string => {
  if (segundos === null || segundos === undefined || !Number.isFinite(segundos)) {
    return 'horário não disponível';
  }

  const total = Math.max(0, Math.round(segundos));
  if (total < 60) return 'agora';

  const minutos = Math.floor(total / 60);
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes > 0
    ? `há ${horas}h ${minutosRestantes}min`
    : `há ${horas}h`;
};

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
