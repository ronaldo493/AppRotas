import {useCallback} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import {useAuthContext} from '../../../core/auth/AuthContext';
import {appLogger} from '../../../shared/logging/appLogger';
import {TIPO_HISTORICO} from '../../historico/models/Historico';
import type {ComandoAssistente} from '../models/ComandoAssistente';
import {consultarHistoricoAssistente} from '../services/consultasAssistenteService';
import type {AssistenteHandlerDependencies} from './assistenteHandlerTypes';

type Params = Pick<
  AssistenteHandlerDependencies,
  'responder' | 'temAcesso' | 'informarAcessoNegado'
>;

/** Mantém as regras de consulta do histórico fora do coordenador de voz. */
export default function useHistoricoAssistenteHandler({
  responder,
  temAcesso,
  informarAcessoNegado,
}: Params) {
  const client = useStrapiClient();
  const {user} = useAuthContext();

  const consultarHistorico = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'historico'}>,
    ): Promise<void> => {
      if (!temAcesso('Historico')) {
        informarAcessoNegado('histórico');
        return;
      }

      if (!user?.username) {
        responder('Não consegui identificar o usuário atual.');
        return;
      }

      try {
        const periodoConsulta = comando.acao === 'resumir'
          ? comando.periodo
          : 'geral';
        const resumo = await consultarHistoricoAssistente(client, {
          username: user.username,
          periodo: periodoConsulta,
          tipo: comando.tipo,
        });

        if (comando.acao === 'consultar_ultimo') {
          const ultimo = resumo.recentes[0];
          if (!ultimo) {
            responder('Não encontrei visita anterior com esse filtro.');
            return;
          }

          const destinos = [...(ultimo.rotas ?? [])]
            .sort((primeiro, segundo) => primeiro.ordem - segundo.ordem)
            .map(rota => rota.codigofilial > 0
              ? `filial ${rota.codigofilial}`
              : rota.nomefilial,
            );
          const dataVisita = new Date(ultimo.datahora);
          const quando = Number.isNaN(dataVisita.getTime())
            ? 'data não informada'
            : dataVisita.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              });
          const destino = destinos.length > 0
            ? destinos.join(', ')
            : 'destino não informado';

          responder(
            `Sua visita mais recente foi em ${quando}: ${destino}.`,
            `Sua visita mais recente foi para ${destino}.`,
          );
          return;
        }

        const periodo = comando.periodo === 'hoje'
          ? 'hoje'
          : comando.periodo === 'ontem'
            ? 'ontem'
            : comando.periodo === 'ultimos_7_dias'
              ? 'nos últimos sete dias'
              : comando.periodo === 'mes_atual'
                ? 'neste mês'
                : 'no histórico';
        const tipo = comando.tipo === TIPO_HISTORICO.RESTAURANTE
          ? ' de restaurantes'
          : comando.tipo === TIPO_HISTORICO.POSTO_COMBUSTIVEL
            ? ' de postos'
            : comando.tipo === TIPO_HISTORICO.LOJA
              ? ' de filiais'
              : '';

        responder(
          resumo.total === 0
            ? `Você não possui registros${tipo} ${periodo}.`
            : `Encontrei ${resumo.total} ${resumo.total === 1 ? 'registro' : 'registros'}${tipo} ${periodo}.`,
        );
      } catch (error: unknown) {
        appLogger.error('Erro ao consultar histórico pelo assistente:', error);
        responder('Não consegui consultar o histórico agora.');
      }
    },
    [client, informarAcessoNegado, responder, temAcesso, user?.username],
  );

  return {consultarHistorico};
}

