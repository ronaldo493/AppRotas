import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import type {
  HistoricoRotaItem,
  HistoricoVisita,
  TipoHistorico,
} from '../models/Historico';
import {TIPO_HISTORICO} from '../models/Historico';
import {useAppTheme} from '../../../core/theme/appTheme';
import HistoricoStyles from '../screens/historicoScreen.styles';

interface HistoricoCardProps {
  item: HistoricoVisita;
}

interface RotaItemProps {
  rota: HistoricoRotaItem;
  tipoHistorico: TipoHistorico;
}

const HISTORY_PRESENTATION = {
  [TIPO_HISTORICO.LOJA]: {
    title: 'Rota de lojas',
    itemLabel: 'Filial',
    icon: 'route',
  },
  [TIPO_HISTORICO.RESTAURANTE]: {
    title: 'Restaurante',
    itemLabel: 'Restaurante',
    icon: 'restaurant',
  },
  [TIPO_HISTORICO.POSTO_COMBUSTIVEL]: {
    title: 'Posto de combustível',
    itemLabel: 'Posto de combustível',
    icon: 'local-gas-station',
  },
} as const;

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data não informada';
  }

  return parsedDate.toLocaleString('pt-BR');
}

function RotaItem({
  rota,
  tipoHistorico,
}: RotaItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const isStoreHistory =
    tipoHistorico ===
    TIPO_HISTORICO.LOJA;
  const presentation =
    HISTORY_PRESENTATION[tipoHistorico];

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
          {isStoreHistory
            ? `Filial ${rota.codigofilial} • ${rota.nomecidade}`
            : `${presentation.itemLabel} • ${rota.nomecidade}`}
        </Text>
      </View>
    </View>
  );
}

export default function HistoricoCard({item}: HistoricoCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const tipoHistorico =
    item.tipoHistorico ??
    TIPO_HISTORICO.LOJA;
  const presentation =
    HISTORY_PRESENTATION[tipoHistorico];

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
          <Text style={[ HistoricoStyles.cardTitle, { color: theme.colors.onSurface }]}>
            {presentation.title}
          </Text>

          <Text style={[ HistoricoStyles.cardDate, { color: theme.colors.onSurfaceVariant }]}>
            {formatDate(item.datahora)}
          </Text>
        </View>

        <MaterialIcons
          name={presentation.icon}
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
              tipoHistorico={tipoHistorico}
            />
          ))}
        </View>
      ) : (
        <Text style={[ HistoricoStyles.emptyRoutesText, { color: theme.colors.onSurfaceVariant } ]}>
          Nenhum item registrado neste histórico.
        </Text>
      )}
    </View>
  );
}
