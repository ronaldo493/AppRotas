import {useCallback, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import useStrapiClient from '../../../core/api/strapiClient';
import {appLogger} from '../../../shared/logging/appLogger';
import type {Filial} from '../../filiais/models/Filial';
import MapService from '../../rotas/services/mapService';
import {
  useExecucaoRota,
} from '../ExecucaoRotaContext';
import type {
  NavegadorRota,
  PlanejamentoExecucaoRota,
  TipoDestinoRota,
} from '../models/ExecucaoRota';
import {
  obterConfiguracaoMonitoramentoRota,
  type ResultadoConfiguracaoMonitoramento,
} from '../services/configuracaoMonitoramentoRotaApi';
import {verificarDisponibilidadeRastreamento} from '../services/backgroundLocationTask';

interface IniciarNavegacaoMonitoradaInput {
  rotas: readonly Filial[];
  navegador: NavegadorRota;
  cidadeOrigem: string | null;
  tipoDestino: TipoDestinoRota;
  monitorar?: boolean;
  planejamento?: PlanejamentoExecucaoRota;
}

/**
 * Orquestra o caso de uso completo: cria a sessão, inicia o GPS e somente
 * depois abre o navegador. Nenhuma tela grava histórico por conta própria.
 */
export default function useNavegacaoMonitorada() {
  const client = useStrapiClient();
  const {
    execucaoAtiva,
    iniciando,
    finalizando,
    iniciarExecucao,
    cancelarPorFalhaAoAbrirNavegador,
    interromperExecucao,
  } = useExecucaoRota();
  const [abrindoNavegador, setAbrindoNavegador] =
    useState(false);
  const [
    verificandoMonitoramento,
    setVerificandoMonitoramento,
  ] = useState(false);
  const checkingConfigurationRef = useRef(false);
  const [verificandoPermissao, setVerificandoPermissao] =
    useState(false);
  const [navegacaoAguardandoPermissao, setNavegacaoAguardandoPermissao] =
    useState<IniciarNavegacaoMonitoradaInput | null>(null);

  const abrirNavegador = useCallback(
    (
      navegador: NavegadorRota,
      rotas: readonly Filial[],
    ): Promise<boolean> =>
      navegador === 'google'
        ? MapService.openGoogleMapsRoute(rotas)
        : MapService.openWazeRoute(rotas),
    [],
  );

  /**
   * Obtém a decisão no momento da ação para que uma alteração no Strapi não
   * dependa de reiniciar o aplicativo. Consultas simultâneas são agrupadas.
   */
  const verificarMonitoramento =
    useCallback(async (): Promise<ResultadoConfiguracaoMonitoramento> => {
      if (checkingConfigurationRef.current) {
        return obterConfiguracaoMonitoramentoRota(
          client,
        );
      }

      checkingConfigurationRef.current = true;
      setVerificandoMonitoramento(true);

      try {
        const result =
          await obterConfiguracaoMonitoramentoRota(
            client,
            {force: true},
          );

        if (result.origem === 'cache') {
          appLogger.warn(
            'Strapi indisponível; será usada a última configuração válida do monitoramento.',
          );
        } else if (result.origem === 'indisponivel') {
          appLogger.warn(
            'Não existe configuração conhecida; a rota será aberta no modo externo.',
          );
        }

        return result;
      } finally {
        checkingConfigurationRef.current = false;
        setVerificandoMonitoramento(false);
      }
    }, [client]);

  const iniciarNavegacaoConfirmada = useCallback(
    async ({
      rotas,
      navegador,
      cidadeOrigem,
      tipoDestino,
      monitorar = true,
      planejamento,
    }: IniciarNavegacaoMonitoradaInput): Promise<boolean> => {
      if (abrindoNavegador) return false;

      setAbrindoNavegador(true);

      try {
        if (!monitorar) {
          return abrirNavegador(
            navegador,
            rotas,
          );
        }

        const result = await iniciarExecucao({
          rotas,
          navegador,
          cidadeOrigem,
          tipoDestino,
          planejamento,
        });

        if (result.status === 'permissao_negada') {
          return false;
        }

        if (
          result.status ===
            'usuario_nao_identificado' ||
          result.status === 'destino_invalido' ||
          result.status === 'erro'
        ) {
          Toast.show({
            type: 'error',
            text1:
              'Não foi possível iniciar a viagem',
            text2: result.mensagem,
            position: 'bottom',
          });
          return false;
        }

        if (result.status === 'ja_existe') {
          Toast.show({
            type: 'info',
            text1:
              'Já existe uma rota em andamento',
            text2:
              'Finalize a viagem atual antes de iniciar outra.',
            position: 'bottom',
          });
          return false;
        }

        if (result.status !== 'iniciada') {
          return false;
        }

        const routeOpened =
          await abrirNavegador(navegador, rotas);

        if (!routeOpened) {
          const canceled =
            await cancelarPorFalhaAoAbrirNavegador(
            result.execucao.codigoSessao,
          );

          Toast.show({
            type: 'error',
            text1: 'Não foi possível abrir o navegador',
            text2: canceled
              ? 'Tente novamente em alguns instantes.'
              : 'A rota foi preservada. Abra o aplicativo novamente para concluir ou interromper.',
            position: 'bottom',
          });
        }

        return routeOpened;
      } catch (error: unknown) {
        appLogger.error(
          'Falha inesperada ao iniciar a navegação:',
          error,
        );
        Toast.show({
          type: 'error',
          text1: 'Não foi possível iniciar a viagem',
          text2: 'Se o problema continuar, feche e abra o aplicativo novamente.',
          position: 'bottom',
        });
        return false;
      } finally {
        setAbrindoNavegador(false);
      }
    },
    [
      abrindoNavegador,
      abrirNavegador,
      cancelarPorFalhaAoAbrirNavegador,
      iniciarExecucao,
    ],
  );

  /**
   * Explica a permissão antes da solicitação nativa quando ainda falta acesso
   * à localização. Depois de concedida, as próximas rotas seguem direto.
   */
  const iniciarNavegacao = useCallback(
    async (
      input: IniciarNavegacaoMonitoradaInput,
    ): Promise<boolean> => {
      if (
        input.monitorar === false ||
        abrindoNavegador
      ) {
        return iniciarNavegacaoConfirmada(input);
      }

      if (
        verificandoPermissao ||
        navegacaoAguardandoPermissao
      ) {
        return false;
      }

      setVerificandoPermissao(true);

      try {
        const permission =
          await verificarDisponibilidadeRastreamento();

        if (
          !permission.concedida &&
          (
            permission.motivo ===
              'primeiro_plano_negado' ||
            permission.motivo ===
              'segundo_plano_negado'
          )
        ) {
          setNavegacaoAguardandoPermissao(input);
          return false;
        }

        return iniciarNavegacaoConfirmada(input);
      } finally {
        setVerificandoPermissao(false);
      }
    },
    [
      abrindoNavegador,
      iniciarNavegacaoConfirmada,
      navegacaoAguardandoPermissao,
      verificandoPermissao,
    ],
  );

  const confirmarPermissaoRastreamento = useCallback((): void => {
    const navigation = navegacaoAguardandoPermissao;
    setNavegacaoAguardandoPermissao(null);

    if (navigation) {
      void iniciarNavegacaoConfirmada(navigation);
    }
  }, [iniciarNavegacaoConfirmada, navegacaoAguardandoPermissao]);

  const cancelarPermissaoRastreamento = useCallback((): void => {
    setNavegacaoAguardandoPermissao(null);
  }, []);

  return {
    execucaoAtiva,
    processando:
      iniciando ||
      finalizando ||
      abrindoNavegador ||
      verificandoMonitoramento ||
      verificandoPermissao,
    iniciarNavegacao,
    verificarMonitoramento,
    interromperNavegacao: interromperExecucao,
    confirmacaoPermissaoVisivel:
      navegacaoAguardandoPermissao !== null,
    confirmarPermissaoRastreamento,
    cancelarPermissaoRastreamento,
  };
}
