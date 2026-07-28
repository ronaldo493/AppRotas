import React, {useMemo, useState} from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../core/theme/appTheme';
import useFiliais from '../filiais/hooks/useFiliais';
import MapService from '../rotas/services/mapService';
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
  const {chamados, error, loading, reload} =
    useChamados();

  const [selectedGroup, setSelectedGroup] =
    useState<TicketGroup>('atribuido');
  const [selectedTicket, setSelectedTicket] =
    useState<Chamado | null>(null);

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

  const traceRoute = async (
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

    await MapService.openGoogleMapsRoute([
      store,
    ]);
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
            style={[
              styles.routeButton,
              {
                backgroundColor:
                  theme.colors
                    .actionBackground,
              },
            ]}
            onPress={() => {
              void traceRoute(item);
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
    </View>
  );
}
