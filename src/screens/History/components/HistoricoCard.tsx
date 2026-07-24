import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import type {
  HistoricoRotaItem,
  HistoricoVisita,
} from '../../../type/Historico';
import HistoricoStyles from '../styles/HistoricoStyles';
import { useAppTheme } from '../../../components/ThemeStyles';

interface HistoricoCardProps {
  item: HistoricoVisita;
}

interface RotaItemProps {
  rota: HistoricoRotaItem;
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data não informada';
  }

  return parsedDate.toLocaleString('pt-BR');
}

function RotaItem({rota}: RotaItemProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[ HistoricoStyles.routeRow, {backgroundColor: theme.colors.surfaceVariant}]}>
      {/* <View style={[ HistoricoStyles.orderContainer, { backgroundColor: theme.colors.primarySoft}]} >
        <Text style={[ HistoricoStyles.orderText, { color: theme.colors.primary }]}>
          {rota.ordem}
        </Text>
      </View> */}

      <View style={HistoricoStyles.routeContent}>
        <Text
          numberOfLines={2}
          style={[ HistoricoStyles.routeName, { color: theme.colors.onSurface}]}
        >
          {rota.nomefilial}
        </Text>

        <Text style={[HistoricoStyles.routeDescription, { color: theme.colors.onSurfaceVariant}]}>
          Filial {rota.codigofilial} •{' '}
          {rota.nomecidade}
        </Text>
      </View>
    </View>
  );
}

export default function HistoricoCard({item}: HistoricoCardProps): React.JSX.Element {
  const theme = useAppTheme();

  const rotasOrdenadas = [...(item.rotas ?? [])].sort(
    (a, b) => a.ordem - b.ordem,
  );

  return (
    <View
      style={[
        HistoricoStyles.historyCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={HistoricoStyles.cardHeader}>
        <View style={HistoricoStyles.cardHeaderContent}>
          {/* <Text style={[ HistoricoStyles.cardTitle, { color: theme.colors.onSurface }]}>
            Rota com {rotasOrdenadas.length}{' '}
            {rotasOrdenadas.length === 1
              ? 'filial'
              : 'filiais'}
          </Text> */}

          <Text style={[ HistoricoStyles.cardDate, { color: theme.colors.onSurfaceVariant }]}>
            {formatDate(item.datahora)}
          </Text>
        </View>

        <MaterialIcons
          name="route"
          size={22}
          color={theme.colors.iconDefault}
        />
      </View>

      {rotasOrdenadas.length > 0 ? (
        <View style={HistoricoStyles.routesContainer}>
          {rotasOrdenadas.map(rota => (
            <RotaItem
              key={`${rota.codigofilial}-${rota.ordem}`}
              rota={rota}
            />
          ))}
        </View>
      ) : (
        <Text style={[ HistoricoStyles.emptyRoutesText, { color: theme.colors.onSurfaceVariant } ]}>
          Nenhuma filial registrada nesta rota.
        </Text>
      )}
    </View>
  );
}