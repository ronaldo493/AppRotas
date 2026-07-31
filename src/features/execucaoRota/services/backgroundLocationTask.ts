import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {Platform} from 'react-native';

import {appLogger} from '../../../shared/logging/appLogger';
import type {NovoPontoRastreamento} from '../models/ExecucaoRota';
import {registrarPontosExecucaoRota} from '../useCases/registrarPontosExecucaoRota';

export const ROUTE_LOCATION_TASK =
  'drogal-route-location-tracking';

interface RouteLocationTaskData {
  locations?: Location.LocationObject[];
}

export type ResultadoPermissaoRastreamento =
  | {concedida: true}
  | {
      concedida: false;
      motivo:
        | 'servico_indisponivel'
        | 'localizacao_desativada'
        | 'primeiro_plano_negado'
        | 'segundo_plano_negado';
    };

/**
 * Consulta o estado atual sem abrir solicitações do sistema operacional.
 */
export async function verificarDisponibilidadeRastreamento(): Promise<ResultadoPermissaoRastreamento> {
  if (Platform.OS === 'web') {
    return {
      concedida: false,
      motivo: 'servico_indisponivel',
    };
  }

  const taskManagerAvailable =
    await TaskManager.isAvailableAsync();

  if (!taskManagerAvailable) {
    return {
      concedida: false,
      motivo: 'servico_indisponivel',
    };
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    return {
      concedida: false,
      motivo: 'localizacao_desativada',
    };
  }

  const foregroundPermission =
    await Location.getForegroundPermissionsAsync();

  if (
    foregroundPermission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    return {
      concedida: false,
      motivo: 'primeiro_plano_negado',
    };
  }

  const backgroundPermission =
    await Location.getBackgroundPermissionsAsync();

  if (
    backgroundPermission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    return {
      concedida: false,
      motivo: 'segundo_plano_negado',
    };
  }

  return {concedida: true};
}

const isFiniteCoordinate = (
  latitude: number,
  longitude: number,
): boolean =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const convertLocation = (
  location: Location.LocationObject,
): NovoPontoRastreamento | null => {
  const {coords, timestamp} = location;

  if (
    !isFiniteCoordinate(
      coords.latitude,
      coords.longitude,
    ) ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    precisao:
      Number.isFinite(coords.accuracy)
        ? coords.accuracy
        : null,
    velocidade:
      coords.speed !== null &&
      Number.isFinite(coords.speed)
        ? Math.max(0, coords.speed)
        : null,
    direcao:
      coords.heading !== null &&
      Number.isFinite(coords.heading)
        ? coords.heading
        : null,
    registradoEm: new Date(timestamp).toISOString(),
  };
};

/*
 * A tarefa precisa ser definida no escopo global. Quando o sistema inicia o
 * aplicativo em segundo plano, nenhum componente React é montado.
 */
if (!TaskManager.isTaskDefined(ROUTE_LOCATION_TASK)) {
  TaskManager.defineTask<RouteLocationTaskData>(
    ROUTE_LOCATION_TASK,
    async ({data, error}) => {
      if (error) {
        appLogger.error(
          'Erro na tarefa de monitoramento da rota:',
          error.message,
        );
        return;
      }

      const locations = data?.locations ?? [];
      const points = locations
        .map(convertLocation)
        .filter(
          (
            point,
          ): point is NovoPontoRastreamento =>
            point !== null,
        );

      if (points.length === 0) return;

      try {
        const result =
          await registrarPontosExecucaoRota(points);

        if (result.concluidaAutomaticamente) {
          await pararRastreamentoLocalizacao();
        }
      } catch (storageError: unknown) {
        appLogger.error(
          'Erro ao armazenar pontos da rota:',
          storageError,
        );
      }
    },
  );
}

/**
 * Solicita as permissões em ordem. A tela deve explicar o monitoramento antes
 * desta chamada, pois no Android a segunda etapa pode abrir as configurações.
 */
export async function solicitarPermissoesRastreamento(): Promise<ResultadoPermissaoRastreamento> {
  if (Platform.OS === 'web') {
    return {
      concedida: false,
      motivo: 'servico_indisponivel',
    };
  }

  const taskManagerAvailable =
    await TaskManager.isAvailableAsync();

  if (!taskManagerAvailable) {
    return {
      concedida: false,
      motivo: 'servico_indisponivel',
    };
  }

  const locationEnabled =
    await Location.hasServicesEnabledAsync();

  if (!locationEnabled) {
    return {
      concedida: false,
      motivo: 'localizacao_desativada',
    };
  }

  let foregroundPermission =
    await Location.getForegroundPermissionsAsync();

  if (
    foregroundPermission.status !==
      Location.PermissionStatus.GRANTED &&
    foregroundPermission.canAskAgain
  ) {
    foregroundPermission =
      await Location.requestForegroundPermissionsAsync();
  }

  if (
    foregroundPermission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    return {
      concedida: false,
      motivo: 'primeiro_plano_negado',
    };
  }

  let backgroundPermission =
    await Location.getBackgroundPermissionsAsync();

  if (
    backgroundPermission.status !==
      Location.PermissionStatus.GRANTED &&
    backgroundPermission.canAskAgain
  ) {
    backgroundPermission =
      await Location.requestBackgroundPermissionsAsync();
  }

  if (
    backgroundPermission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    return {
      concedida: false,
      motivo: 'segundo_plano_negado',
    };
  }

  return {concedida: true};
}

/**
 * Mantém uma notificação visível enquanto o GPS continua ativo no Android.
 */
export async function iniciarRastreamentoLocalizacao(): Promise<void> {
  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(
      ROUTE_LOCATION_TASK,
    );

  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(
    ROUTE_LOCATION_TASK,
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 20,
      timeInterval: 10_000,
      deferredUpdatesDistance: 50,
      deferredUpdatesInterval: 30_000,
      deferredUpdatesTimeout: 30_000,
      activityType:
        Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Rota em andamento',
        notificationBody:
          'O trajeto será registrado até a confirmação dos destinos.',
        notificationColor: '#C4473D',
        killServiceOnDestroy: false,
      },
    },
  );
}

export async function pararRastreamentoLocalizacao(): Promise<void> {
  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(
      ROUTE_LOCATION_TASK,
    );

  if (!alreadyStarted) return;

  await Location.stopLocationUpdatesAsync(
    ROUTE_LOCATION_TASK,
  );
}

/**
 * Obtém um ponto preciso para registrar o início ou o encerramento da viagem.
 */
export async function obterLocalizacaoRastreamento(): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });
}

export function converterLocalizacaoEmPonto(
  location: Location.LocationObject,
): NovoPontoRastreamento | null {
  return convertLocation(location);
}
