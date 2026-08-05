import Constants from 'expo-constants';

import type {LocationSnapshot} from '../../../core/location/models/LocationSnapshot';
import type {ExecucaoRotaOwner} from '../services/execucaoRotaOwner';
import type {
  DestinoExecucaoRota,
  ExecucaoRota,
  TipoOcorrenciaLocalizacao,
} from '../models/ExecucaoRota';
import {STATUS_EXECUCAO_ROTA} from '../models/ExecucaoRota';
import type {
  IniciarExecucaoRotaInput,
  PermissaoRastreamentoNegada,
} from '../models/ExecucaoRotaContext';

const criarCodigoSessao = (): string =>
  [
    'rota',
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join('-');

/** Traduz a falha técnica de permissão para uma orientação ao usuário. */
export function obterMensagemPermissaoRastreamento(
  permission: PermissaoRastreamentoNegada,
): string {
  switch (permission.motivo) {
    case 'servico_indisponivel':
      return 'O registro do percurso em segundo plano não está disponível nesta instalação. Use uma nova build do aplicativo.';
    case 'localizacao_desativada':
      return 'Ative a localização do aparelho antes de iniciar a viagem.';
    case 'primeiro_plano_negado':
      return 'Permita o acesso à localização para iniciar a viagem.';
    case 'segundo_plano_negado':
      return 'Permita a localização o tempo todo para registrar o percurso com Maps ou Waze aberto.';
  }
}

/** Converte uma falha de permissão na ocorrência persistida pela execução. */
export function mapearMotivoPermissaoParaOcorrencia(
  permission: PermissaoRastreamentoNegada,
): TipoOcorrenciaLocalizacao | null {
  switch (permission.motivo) {
    case 'localizacao_desativada':
      return 'localizacao_desativada';
    case 'primeiro_plano_negado':
      return 'permissao_primeiro_plano_revogada';
    case 'segundo_plano_negado':
      return 'permissao_segundo_plano_revogada';
    case 'servico_indisponivel':
      return null;
  }
}

/** Monta a execução local inicial sem acessar banco, rede ou GPS. */
export function criarExecucaoRotaLocal(
  input: IniciarExecucaoRotaInput,
  owner: ExecucaoRotaOwner,
  originSnapshot: LocationSnapshot,
  destinations: DestinoExecucaoRota[],
  deviceSessionCode: string | null,
): ExecucaoRota {
  return {
    codigoSessao: criarCodigoSessao(),
    sessaoDispositivoCodigo: deviceSessionCode,
    ownerKey: owner.key,
    usuarioId: owner.usuarioId,
    usuarioDocumentId: owner.usuarioDocumentId,
    username: owner.username,
    setor: owner.setor,
    status: STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
    navegador: input.navegador,
    iniciadaEm: new Date().toISOString(),
    finalizadaEm: null,
    cidadeOrigem: originSnapshot.city,
    origem: originSnapshot.coordinates,
    destinos: destinations,
    trajetoPlanejado:
      input.planejamento?.trajetoPlanejado ?? null,
    distanciaPlanejadaMetros:
      input.planejamento?.distanciaPlanejadaMetros ?? null,
    duracaoPlanejadaSegundos:
      input.planejamento?.duracaoPlanejadaSegundos ?? null,
    motivoFinalizacao: null,
    ultimaLocalizacaoEm: null,
    versaoAplicativo:
      Constants.expoConfig?.version ?? null,
    servidorDocumentId:
      input.planejamento?.servidorDocumentId ?? null,
    inicioSincronizado: false,
    finalizacaoSincronizada: false,
    resumo: null,
  };
}
