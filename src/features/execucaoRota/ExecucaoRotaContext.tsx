import Constants from 'expo-constants';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  AppState,
  Linking,
  Platform,
  type AppStateStatus,
} from 'react-native';

import useStrapiClient from '../../core/api/strapiClient';
import {useAuthContext} from '../../core/auth/AuthContext';
import {appLogger} from '../../shared/logging/appLogger';
import type {Filial} from '../filiais/models/Filial';
import {
  MOTIVO_FINALIZACAO_ROTA,
  STATUS_EXECUCAO_ROTA,
  type ExecucaoRota,
  type DestinoExecucaoRota,
  type MotivoFinalizacaoRota,
  type NavegadorRota,
  type PlanejamentoExecucaoRota,
  type TipoDestinoRota,
  type TipoOcorrenciaLocalizacao,
} from './models/ExecucaoRota';
import {
  converterLocalizacaoEmPonto,
  iniciarRastreamentoLocalizacao,
  obterLocalizacaoRastreamento,
  pararRastreamentoLocalizacao,
  solicitarPermissoesRastreamento,
  verificarDisponibilidadeRastreamento,
  type ResultadoPermissaoRastreamento,
} from './services/backgroundLocationTask';
import {criarExecucaoRotaApi} from './services/execucaoRotaApi';
import {
  adicionarPontosRastreamento,
  finalizarExecucaoRotaLocal,
  inicializarBancoExecucaoRota,
  listarOcorrenciasLocalizacao,
  listarPontosExecucaoRota,
  normalizarLocalizacaoExecucao,
  obterExecucaoRota,
  obterExecucaoRotaAtiva,
  registrarIndisponibilidadeLocalizacao,
  salvarExecucaoRota,
} from './services/execucaoRotaDatabase';
import {
  obterExecucaoRotaOwner,
  type ExecucaoRotaOwner,
} from './services/execucaoRotaOwner';
import {calcularMetricasExecucaoRota} from './useCases/calcularMetricasExecucaoRota';
import {converterFiliaisEmDestinos} from './useCases/converterDestinosRota';
import {registrarPontosExecucaoRota} from './useCases/registrarPontosExecucaoRota';
import {sincronizarExecucoesRota} from './useCases/sincronizarExecucoesRota';

interface IniciarExecucaoRotaInput {
  rotas: readonly Filial[];
  navegador: NavegadorRota;
  cidadeOrigem: string | null;
  tipoDestino?: TipoDestinoRota;
  planejamento?: PlanejamentoExecucaoRota;
}

export type ResultadoInicioExecucaoRota =
  | {status: 'iniciada'; execucao: ExecucaoRota}
  | {status: 'ja_existe'; execucao: ExecucaoRota}
  | {
      status: 'permissao_negada';
      permissao: Exclude<
        ResultadoPermissaoRastreamento,
        {concedida: true}
      >;
    }
  | {
      status:
        | 'usuario_nao_identificado'
        | 'destino_invalido'
        | 'erro';
      mensagem: string;
    };

interface ExecucaoRotaContextValue {
  execucaoAtiva: ExecucaoRota | null;
  inicializando: boolean;
  iniciando: boolean;
  finalizando: boolean;
  indisponibilidadeLocalizacao:
    | Exclude<
        ResultadoPermissaoRastreamento,
        {concedida: true}
      >
    | null;
  verificandoLocalizacao: boolean;
  iniciarExecucao: (
    input: IniciarExecucaoRotaInput,
  ) => Promise<ResultadoInicioExecucaoRota>;
  cancelarPorFalhaAoAbrirNavegador: (
    codigoSessao: string,
  ) => Promise<void>;
  interromperExecucao: () => Promise<void>;
  abrirConfiguracoesLocalizacao: () => Promise<void>;
  verificarLocalizacao: () => Promise<void>;
  sincronizar: () => Promise<void>;
}

const ExecucaoRotaContext =
  createContext<ExecucaoRotaContextValue | null>(
    null,
  );

const createSessionCode = (): string =>
  [
    'rota',
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join('-');

const getPermissionMessage = (
  permission: Exclude<
    ResultadoPermissaoRastreamento,
    {concedida: true}
  >,
): string => {
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
};

const mapPermissionReasonToEvent = (
  permission: Exclude<
    ResultadoPermissaoRastreamento,
    {concedida: true}
  >,
): TipoOcorrenciaLocalizacao | null => {
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
};

const createExecution = (
  input: IniciarExecucaoRotaInput,
  owner: ExecucaoRotaOwner,
  origin: {latitude: number; longitude: number},
  destinations: DestinoExecucaoRota[],
): ExecucaoRota => ({
  codigoSessao: createSessionCode(),
  ownerKey: owner.key,
  usuarioId: owner.usuarioId,
  usuarioDocumentId:
    owner.usuarioDocumentId,
  username: owner.username,
  setor: owner.setor,
  status: STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
  navegador: input.navegador,
  iniciadaEm: new Date().toISOString(),
  finalizadaEm: null,
  cidadeOrigem: input.cidadeOrigem,
  origem: origin,
  destinos: destinations,
  trajetoPlanejado:
    input.planejamento?.trajetoPlanejado ?? null,
  distanciaPlanejadaMetros:
    input.planejamento
      ?.distanciaPlanejadaMetros ?? null,
  duracaoPlanejadaSegundos:
    input.planejamento
      ?.duracaoPlanejadaSegundos ?? null,
  motivoFinalizacao: null,
  ultimaLocalizacaoEm: null,
  versaoAplicativo:
    Constants.expoConfig?.version ?? null,
  servidorDocumentId:
    input.planejamento?.servidorDocumentId ?? null,
  inicioSincronizado: false,
  finalizacaoSincronizada: false,
  resumo: null,
});

export function ExecucaoRotaProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const {user} = useAuthContext();
  const client = useStrapiClient();
  const api = useMemo(
    () => criarExecucaoRotaApi(client),
    [client],
  );
  const owner = useMemo(
    () => obterExecucaoRotaOwner(user),
    [
      user?.documentId,
      user?.id,
      user?.setor,
      user?.username,
    ],
  );
  const [execucaoAtiva, setExecucaoAtiva] =
    useState<ExecucaoRota | null>(null);
  const [inicializando, setInicializando] =
    useState(true);
  const [iniciando, setIniciando] =
    useState(false);
  const [finalizando, setFinalizando] =
    useState(false);
  const [
    indisponibilidadeLocalizacao,
    setIndisponibilidadeLocalizacao,
  ] = useState<
    | Exclude<
        ResultadoPermissaoRastreamento,
        {concedida: true}
      >
    | null
  >(null);
  const [
    verificandoLocalizacao,
    setVerificandoLocalizacao,
  ] = useState(false);
  const startingRef = useRef(false);
  const finalizingRef = useRef(false);
  const checkingLocationRef = useRef(false);
  const synchronizationStateRef = useRef(
    new Map<
      string,
      {running: boolean; requested: boolean}
    >(),
  );
  const currentOwnerKeyRef = useRef<string | null>(
    owner?.key ?? null,
  );
  const activeExecutionRef =
    useRef<ExecucaoRota | null>(execucaoAtiva);

  currentOwnerKeyRef.current = owner?.key ?? null;
  activeExecutionRef.current = execucaoAtiva;

  const synchronizeOwner = useCallback(
    async (
      executionOwner: ExecucaoRotaOwner,
    ): Promise<void> => {
      await sincronizarExecucoesRota(
        executionOwner.key,
        api,
      );

      if (
        currentOwnerKeyRef.current !==
        executionOwner.key
      ) {
        return;
      }

      const active = await obterExecucaoRotaAtiva();

      setExecucaoAtiva(
        active?.ownerKey === executionOwner.key
          ? active
          : null,
      );
    },
    [api],
  );

  const scheduleSynchronization = useCallback(
    (executionOwner: ExecucaoRotaOwner): void => {
      const states =
        synchronizationStateRef.current;
      const state = states.get(
        executionOwner.key,
      ) ?? {
        running: false,
        requested: false,
      };

      state.requested = true;
      states.set(executionOwner.key, state);

      if (state.running) return;

      state.running = true;

      void (async () => {
        try {
          do {
            state.requested = false;
            await synchronizeOwner(executionOwner);

          /*
           * Se uma finalização ocorreu enquanto a sincronização inicial
           * estava em andamento, a segunda passada envia o estado recente.
           */
          } while (state.requested);
        } catch (error: unknown) {
          appLogger.warn(
            'A sincronização das execuções será tentada novamente:',
            error instanceof Error
              ? error.message
              : 'erro desconhecido',
          );
        } finally {
          state.running = false;

          if (!state.requested) {
            states.delete(executionOwner.key);
          }
        }
      })();
    },
    [synchronizeOwner],
  );

  const finishLocalExecution = useCallback(
    async (
      execution: ExecucaoRota,
      status:
        | typeof STATUS_EXECUCAO_ROTA.CONCLUIDA
        | typeof STATUS_EXECUCAO_ROTA.CANCELADA
        | typeof STATUS_EXECUCAO_ROTA.INTERROMPIDA,
      reason: MotivoFinalizacaoRota,
      captureFinalPoint = true,
    ): Promise<void> => {
      if (captureFinalPoint) {
        try {
          const location =
            await obterLocalizacaoRastreamento();
          const point =
            converterLocalizacaoEmPonto(location);

          if (point) {
            await adicionarPontosRastreamento([
              point,
            ]);
          }
        } catch {
          /*
           * A ausência do último ponto não impede o encerramento. A lacuna
           * permanecerá visível nos indicadores da execução.
           */
        }
      }

      try {
        await pararRastreamentoLocalizacao();
      } catch (error: unknown) {
        appLogger.warn(
          'Não foi possível encerrar imediatamente o serviço de localização:',
          error,
        );
      }

      const finishedAt = new Date().toISOString();
      await normalizarLocalizacaoExecucao(
        execution.codigoSessao,
        finishedAt,
      );
      const [points, locationEvents] =
        await Promise.all([
          listarPontosExecucaoRota(
            execution.codigoSessao,
          ),
          listarOcorrenciasLocalizacao(
            execution.codigoSessao,
          ),
        ]);
      const summary = calcularMetricasExecucaoRota({
        pontos: points,
        destinos: execution.destinos,
        iniciadaEm: execution.iniciadaEm,
        finalizadaEm: finishedAt,
        trajetoPlanejado:
          execution.trajetoPlanejado,
        ocorrenciasLocalizacao: locationEvents,
      });
      const finalStatus =
        status === STATUS_EXECUCAO_ROTA.INTERROMPIDA
          ? summary.destinosConfirmadosPorGps
            ? STATUS_EXECUCAO_ROTA.CONCLUIDA
            : summary.quantidadeDestinosVisitados > 0
              ? STATUS_EXECUCAO_ROTA.CONCLUIDA_PARCIAL
              : status
          : status;
      const finalReason =
        finalStatus ===
        STATUS_EXECUCAO_ROTA.CONCLUIDA
          ? MOTIVO_FINALIZACAO_ROTA.CONCLUIDA_AUTOMATICAMENTE
          : reason;

      await finalizarExecucaoRotaLocal(
        execution.codigoSessao,
        finalStatus,
        finalReason,
        finishedAt,
        summary,
      );
    },
    [],
  );

  /**
   * Audita o estado do GPS e das permissões enquanto existe uma rota ativa.
   * A consulta não abre prompts automaticamente nem altera configurações.
   */
  const verificarLocalizacao = useCallback(
    async (): Promise<void> => {
      if (checkingLocationRef.current) return;

      checkingLocationRef.current = true;
      setVerificandoLocalizacao(true);

      try {
        const active =
          await obterExecucaoRotaAtiva();

        if (
          !active ||
          !owner ||
          active.ownerKey !== owner.key
        ) {
          const hadActiveExecution =
            activeExecutionRef.current !== null;

          setExecucaoAtiva(null);
          setIndisponibilidadeLocalizacao(null);

          if (hadActiveExecution && owner) {
            scheduleSynchronization(owner);
          }

          return;
        }

        setExecucaoAtiva(current =>
          current?.codigoSessao ===
          active.codigoSessao
            ? current
            : active,
        );

        const availability =
          await verificarDisponibilidadeRastreamento();

        if (!availability.concedida) {
          const eventType =
            mapPermissionReasonToEvent(availability);

          if (eventType) {
            await registrarIndisponibilidadeLocalizacao(
              active.codigoSessao,
              eventType,
            );
          }

          setIndisponibilidadeLocalizacao(
            availability,
          );
          return;
        }

        await normalizarLocalizacaoExecucao(
          active.codigoSessao,
        );
        setIndisponibilidadeLocalizacao(null);

        try {
          await iniciarRastreamentoLocalizacao();
        } catch (error: unknown) {
          appLogger.warn(
            'Não foi possível restaurar o registro do percurso:',
            error,
          );
        }
      } finally {
        checkingLocationRef.current = false;
        setVerificandoLocalizacao(false);
      }
    },
    [owner, scheduleSynchronization],
  );

  const abrirConfiguracoesLocalizacao =
    useCallback(async (): Promise<void> => {
      try {
        if (
          Platform.OS === 'android' &&
          indisponibilidadeLocalizacao?.motivo ===
            'localizacao_desativada'
        ) {
          await Linking.sendIntent(
            'android.settings.LOCATION_SOURCE_SETTINGS',
          );
          return;
        }

        await Linking.openSettings();
      } catch {
        await Linking.openSettings();
      }
    }, [indisponibilidadeLocalizacao?.motivo]);

  useEffect(() => {
    let mounted = true;

    const restore = async (): Promise<void> => {
      setInicializando(true);

      try {
        await inicializarBancoExecucaoRota();

        const active =
          await obterExecucaoRotaAtiva();

        if (
          active &&
          (!owner || active.ownerKey !== owner.key)
        ) {
          await finishLocalExecution(
            active,
            STATUS_EXECUCAO_ROTA.INTERROMPIDA,
            MOTIVO_FINALIZACAO_ROTA.INTERROMPIDA_LOGOUT,
            false,
          );

          if (mounted) setExecucaoAtiva(null);
        } else if (active && owner) {
          if (mounted) setExecucaoAtiva(active);
          await verificarLocalizacao();
        } else if (mounted) {
          setExecucaoAtiva(null);
        }

        if (owner) {
          scheduleSynchronization(owner);
        }
      } catch (error: unknown) {
        appLogger.error(
          'Erro ao restaurar monitoramento de rota:',
          error,
        );
      } finally {
        if (mounted) setInicializando(false);
      }
    };

    void restore();

    return () => {
      mounted = false;
    };
  }, [
    finishLocalExecution,
    owner,
    scheduleSynchronization,
    verificarLocalizacao,
  ]);

  useEffect(() => {
    const handleAppStateChange = (
      state: AppStateStatus,
    ): void => {
      if (state !== 'active' || !owner) return;

      void verificarLocalizacao();
      scheduleSynchronization(owner);
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => subscription.remove();
  }, [
    owner,
    scheduleSynchronization,
    verificarLocalizacao,
  ]);

  useEffect(() => {
    if (!execucaoAtiva) return;

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void verificarLocalizacao();
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [execucaoAtiva, verificarLocalizacao]);

  const iniciarExecucao = useCallback(
    async (
      input: IniciarExecucaoRotaInput,
    ): Promise<ResultadoInicioExecucaoRota> => {
      if (!owner) {
        return {
          status: 'usuario_nao_identificado',
          mensagem:
            'Não foi possível identificar o usuário autenticado.',
        };
      }

      if (startingRef.current) {
        return {
          status: 'erro',
          mensagem:
            'Uma viagem já está sendo preparada.',
        };
      }

      const existingExecution =
        await obterExecucaoRotaAtiva();

      if (existingExecution) {
        setExecucaoAtiva(existingExecution);

        return {
          status: 'ja_existe',
          execucao: existingExecution,
        };
      }

      startingRef.current = true;
      setIniciando(true);

      try {
        const destinations =
          converterFiliaisEmDestinos(
            input.rotas,
            input.tipoDestino ?? 'loja',
          );
        const permission =
          await solicitarPermissoesRastreamento();

        if (!permission.concedida) {
          setIndisponibilidadeLocalizacao(
            permission,
          );

          return {
            status: 'permissao_negada',
            permissao: permission,
          };
        }

        setIndisponibilidadeLocalizacao(null);

        const initialLocation =
          await obterLocalizacaoRastreamento();
        const initialPoint =
          converterLocalizacaoEmPonto(
            initialLocation,
          );
        const execution = createExecution(
          input,
          owner,
          {
            latitude:
              initialLocation.coords.latitude,
            longitude:
              initialLocation.coords.longitude,
          },
          destinations,
        );

        await salvarExecucaoRota(execution);

        try {
          if (initialPoint) {
            await registrarPontosExecucaoRota([
              initialPoint,
            ]);
          }

          await iniciarRastreamentoLocalizacao();
        } catch (trackingError: unknown) {
          await finishLocalExecution(
            execution,
            STATUS_EXECUCAO_ROTA.INTERROMPIDA,
            MOTIVO_FINALIZACAO_ROTA.INTERROMPIDA_ERRO,
            false,
          );

          return {
            status: 'erro',
            mensagem:
              trackingError instanceof Error
                ? trackingError.message
                : 'Não foi possível iniciar o registro do percurso.',
          };
        }

        setExecucaoAtiva(execution);
        scheduleSynchronization(owner);

        return {
          status: 'iniciada',
          execucao: execution,
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível iniciar a viagem.';

        return {
          status: message.includes('coordenadas')
            ? 'destino_invalido'
            : 'erro',
          mensagem: message,
        };
      } finally {
        startingRef.current = false;
        setIniciando(false);
      }
    },
    [
      finishLocalExecution,
      owner,
      scheduleSynchronization,
    ],
  );

  const finishActiveExecution = useCallback(
    async (
      status:
        | typeof STATUS_EXECUCAO_ROTA.CONCLUIDA
        | typeof STATUS_EXECUCAO_ROTA.CANCELADA
        | typeof STATUS_EXECUCAO_ROTA.INTERROMPIDA,
      reason: MotivoFinalizacaoRota,
    ): Promise<void> => {
      const currentExecution =
        execucaoAtiva ??
        (await obterExecucaoRotaAtiva());

      if (
        !currentExecution ||
        finalizingRef.current
      ) {
        return;
      }

      finalizingRef.current = true;
      setFinalizando(true);

      try {
        await finishLocalExecution(
          currentExecution,
          status,
          reason,
        );
        setExecucaoAtiva(null);
        setIndisponibilidadeLocalizacao(null);

        if (owner) {
          scheduleSynchronization(owner);
        }
      } finally {
        finalizingRef.current = false;
        setFinalizando(false);
      }
    },
    [
      execucaoAtiva,
      finishLocalExecution,
      owner,
      scheduleSynchronization,
    ],
  );

  const cancelarPorFalhaAoAbrirNavegador =
    useCallback(
      async (codigoSessao: string): Promise<void> => {
        const execution = await obterExecucaoRota(
          codigoSessao,
        );

        if (
          !execution ||
          execution.status !==
            STATUS_EXECUCAO_ROTA.EM_ANDAMENTO
        ) {
          return;
        }

        await finishActiveExecution(
          STATUS_EXECUCAO_ROTA.CANCELADA,
          MOTIVO_FINALIZACAO_ROTA.CANCELADA_ABERTURA_NAVEGADOR,
        );
      },
      [finishActiveExecution],
    );

  const interromperExecucao = useCallback(
    (): Promise<void> =>
      finishActiveExecution(
        STATUS_EXECUCAO_ROTA.INTERROMPIDA,
        MOTIVO_FINALIZACAO_ROTA.INTERROMPIDA_USUARIO,
      ),
    [finishActiveExecution],
  );

  const sincronizar = useCallback(async (): Promise<void> => {
    if (!owner) return;

    await synchronizeOwner(owner);
  }, [owner, synchronizeOwner]);

  const value = useMemo<ExecucaoRotaContextValue>(
    () => ({
      execucaoAtiva,
      inicializando,
      iniciando,
      finalizando,
      indisponibilidadeLocalizacao,
      verificandoLocalizacao,
      iniciarExecucao,
      cancelarPorFalhaAoAbrirNavegador,
      interromperExecucao,
      abrirConfiguracoesLocalizacao,
      verificarLocalizacao,
      sincronizar,
    }),
    [
      cancelarPorFalhaAoAbrirNavegador,
      abrirConfiguracoesLocalizacao,
      execucaoAtiva,
      finalizando,
      indisponibilidadeLocalizacao,
      inicializando,
      iniciando,
      iniciarExecucao,
      interromperExecucao,
      sincronizar,
      verificandoLocalizacao,
      verificarLocalizacao,
    ],
  );

  return (
    <ExecucaoRotaContext.Provider value={value}>
      {children}
    </ExecucaoRotaContext.Provider>
  );
}

export function useExecucaoRota(): ExecucaoRotaContextValue {
  const context = useContext(ExecucaoRotaContext);

  if (!context) {
    throw new Error(
      'useExecucaoRota deve ser utilizado dentro de ExecucaoRotaProvider.',
    );
  }

  return context;
}

export function obterMensagemPermissaoRastreamento(
  permission: Exclude<
    ResultadoPermissaoRastreamento,
    {concedida: true}
  >,
): string {
  return getPermissionMessage(permission);
}
