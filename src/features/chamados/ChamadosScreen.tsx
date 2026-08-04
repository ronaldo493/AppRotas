import React, {useMemo, useState} from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Dialog,
  Portal,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../core/theme/appTheme';
import ConfirmacaoPermissaoRastreamentoDialog from '../execucaoRota/components/ConfirmacaoPermissaoRastreamentoDialog';
import useNavegacaoMonitorada from '../execucaoRota/hooks/useNavegacaoMonitorada';
import {definirFluxoMonitoramentoRota} from '../execucaoRota/useCases/definirFluxoMonitoramentoRota';
import type {NavegadorRota} from '../execucaoRota/models/ExecucaoRota';
import useFiliais from '../filiais/hooks/useFiliais';
import type {Filial} from '../filiais/models/Filial';
import useChamados from './hooks/useChamados';
import type {Chamado} from './models/Chamado';
import styles from './chamadosScreen.styles';

type TicketGroup =
  | 'atribuido'
  | 'naoAtribuido';

const isAssigned = (ticket: Chamado): boolean =>
  ticket.situacao === 1 ||
  ticket.situacao === 2;

const sortByOpeningDate = (
  first: Chamado,
  second: Chamado,
): number =>
  new Date(second.dataabertura).getTime() -
  new Date(first.dataabertura).getTime();

export default function ChamadosScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {filiais} = useFiliais();
  const {
    execucaoAtiva,
    processando,
    iniciarNavegacao,
    verificarMonitoramento,
    confirmacaoPermissaoVisivel,
    confirmarPermissaoRastreamento,
    cancelarPermissaoRastreamento,
  } = useNavegacaoMonitorada();
  const {chamados, error, loading, reload} =
    useChamados();

  const [selectedGroup, setSelectedGroup] =
    useState<TicketGroup>('atribuido');
  const [selectedTicket, setSelectedTicket] =
    useState<Chamado | null>(null);
  const [pendingStore, setPendingStore] =
    useState<Filial | null>(null);
  const [
    navigatorDialogVisible,
    setNavigatorDialogVisible,
  ] = useState(false);
  const [
    monitoringEnabledForFlow,
    setMonitoringEnabledForFlow,
  ] = useState(false);

  const assignedTickets = useMemo(
    () =>
      chamados
        .filter(isAssigned)
        .sort(sortByOpeningDate),
    [chamados],
  );

  const unassignedTickets = useMemo(
    () =>
      chamados
        .filter(ticket => ticket.situacao === 0)
        .sort(sortByOpeningDate),
    [chamados],
  );

  const visibleTickets =
    selectedGroup === 'atribuido'
      ? assignedTickets
      : unassignedTickets;

  const requestRoute = async (
    ticket: Chamado,
  ): Promise<void> => {
    const store = filiais.find(
      filial =>
        filial.nomefilial ===
        ticket.nomefilial,
    );

    if (!store) {
      Toast.show({
        type: 'info',
        text1: 'Filial não localizada',
        text2:
          'Não foi possível encontrar as coordenadas deste chamado.',
      });
      return;
    }

    const monitoringConfiguration =
      await verificarMonitoramento();
    const monitoringFlow =
      definirFluxoMonitoramentoRota(
        monitoringConfiguration,
      );

    setPendingStore(store);
    setMonitoringEnabledForFlow(
      monitoringFlow.monitorar,
    );
    setNavigatorDialogVisible(true);
  };

  const traceRoute = async (
    navegador: NavegadorRota,
  ): Promise<void> => {
    if (!pendingStore || processando) return;

    setNavigatorDialogVisible(false);

    await iniciarNavegacao({
      rotas: [pendingStore],
      navegador,
      tipoDestino: 'loja',
      monitorar: monitoringEnabledForFlow,
    });
  };

  const renderTicket = ({
    item,
  }: ListRenderItemInfo<Chamado>): React.JSX.Element => {
    const isSelected =
      selectedTicket?.documentId ===
        item.documentId ||
      (
        !item.documentId &&
        selectedTicket?.id === item.id
      );

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.item,
            {
              backgroundColor:
                theme.colors.surface,
              borderColor:
                theme.colors.outline,
              opacity:
                selectedTicket &&
                !isSelected
                  ? 0.35
                  : 1,
            },
          ]}
          onPress={() =>
            setSelectedTicket(current =>
              current === item ? null : item,
            )
          }
        >
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.textContent,
                styles.storeName,
                {
                  color:
                    theme.colors.onSurface,
                },
              ]}
            >
              {item.nomefilial}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.textContent,
                {
                  color:
                    theme.colors.onSurface,
                },
              ]}
            >
              Título: {item.titulo}
            </Text>

            <Text
              style={[
                styles.textContent,
                styles.openingDate,
                {
                  color:
                    theme.colors
                      .onSurfaceVariant,
                },
              ]}
            >
              Abertura:{' '}
              {new Date(
                item.dataabertura,
              ).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          <TouchableOpacity
            disabled={
              processando ||
              Boolean(execucaoAtiva)
            }
            style={[
              styles.routeButton,
              {
                backgroundColor:
                  theme.colors
                    .actionBackground,
                opacity:
                  processando || execucaoAtiva
                    ? 0.55
                    : 1,
              },
            ]}
            onPress={() => {
              void requestRoute(item);
            }}
          >
            <Text
              style={[
                styles.routeButtonText,
                {
                  color:
                    theme.colors
                      .actionForeground,
                },
              ]}
            >
              Traçar rota
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {isSelected && (
          <View
            style={[
              styles.detailContainer,
              {
                backgroundColor:
                  theme.colors
                    .surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {color: theme.colors.error},
              ]}
            >
              {item.descricaosituacao}
            </Text>

            <Text
              style={[
                styles.textContent,
                {
                  color:
                    theme.colors.onSurface,
                },
              ]}
            >
              {item.descricao}
            </Text>

            <Text
              style={[
                styles.textContent,
                {
                  color:
                    theme.colors.onSurface,
                },
              ]}
            >
              COLABORADOR:{' '}
              {item.nomeabertura ??
                'Não informado'}
            </Text>

            <Text
              style={[
                styles.textContent,
                {
                  color:
                    theme.colors.onSurface,
                },
              ]}
            >
              TÉCNICO:{' '}
              {item.nomeresponsavel ||
                'Não atribuído'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.background,
        },
      ]}
    >
      <View style={styles.filterContainer}>
        {(
          [
            ['atribuido', 'ATRIBUÍDOS'],
            [
              'naoAtribuido',
              'NÃO ATRIBUÍDOS',
            ],
          ] as const
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  selectedGroup === value
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  theme.colors.outline,
              },
            ]}
            onPress={() => {
              setSelectedGroup(value);
              setSelectedTicket(null);
            }}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedGroup === value
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visibleTickets}
        keyExtractor={item =>
          item.documentId ??
          String(item.id ?? item.sequencia)
        }
        renderItem={renderTicket}
        refreshing={loading}
        onRefresh={() => {
          void reload();
        }}
        contentContainerStyle={
          styles.listContent
        }
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              {
                color:
                  theme.colors
                    .onSurfaceVariant,
              },
            ]}
          >
            {error ??
              'Nenhum chamado encontrado.'}
          </Text>
        }
      />

      <Text
        style={[
          styles.total,
          {
            color: theme.colors.onSurface,
            backgroundColor:
              theme.colors.surface,
          },
        ]}
      >
        TOTAL: {visibleTickets.length}
      </Text>

      <Portal>
        <Dialog
          visible={navigatorDialogVisible}
          dismissable={!processando}
          onDismiss={() =>
            setNavigatorDialogVisible(false)
          }
          style={{
            backgroundColor: theme.colors.surface,
          }}
        >
          <Dialog.Title>
            Escolha o navegador
          </Dialog.Title>

          <Dialog.Content>
            {monitoringEnabledForFlow ? (
              <Text
              style={{
                color:
                  theme.colors.onSurfaceVariant,
              }}
            >
              Para registrar e concluir o percurso, o
              aplicativo utiliza sua localização
              enquanto o Google Maps estiver aberto.
              A execução será concluída
              automaticamente após a confirmação da
              filial.
              </Text>
            ) : (
              <Text
                style={{
                  color:
                    theme.colors.onSurfaceVariant,
                }}
              >
                A rota será aberta no navegador
                escolhido.
              </Text>
            )}
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              disabled={processando}
              onPress={() =>
                setNavigatorDialogVisible(false)
              }
            >
              Cancelar
            </Button>

            <Button
              disabled={processando}
              onPress={() =>
                void traceRoute('waze')
              }
            >
              Waze
            </Button>

            <Button
              loading={processando}
              disabled={processando}
              onPress={() =>
                void traceRoute('google')
              }
            >
              Google Maps
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmacaoPermissaoRastreamentoDialog
        visible={confirmacaoPermissaoVisivel}
        onConfirm={confirmarPermissaoRastreamento}
        onDismiss={cancelarPermissaoRastreamento}
      />
    </View>
  );
}
