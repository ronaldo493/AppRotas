import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {ActivityIndicator,Text, TouchableOpacity,View} from 'react-native';

import type { RouteEstimate,} from '../../../hooks/useRouteEstimate';
import type { Filial } from '../../../type/Filial';
import { useAppTheme } from '../../ThemeStyles';
import SearchBarStyles from '../styles/SearchBarStyles';

interface FilialResultCardProps {
  filial: Filial;
  estimate: RouteEstimate | null;
  loadingEstimate: boolean;
  estimateError: string | null;
  hasLocation: boolean;
  onAdd: () => void;
}

interface FilialDetail {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  complement?: string;
}

export default function FilialResultCard({
  filial,
  estimate,
  loadingEstimate,
  estimateError,
  hasLocation,
  onAdd,
}: FilialResultCardProps): React.JSX.Element {
  const theme = useAppTheme();

  const filialDetails =
    useMemo<FilialDetail[]>(() => {
      const address = [filial.endereco, filial.numero].filter(Boolean).join(', ');

      return [
        {
          key: 'endereco',
          icon: 'location-on',
          value: address ? `Endereço: ${address}` : 'Endereço não informado',
          complement: filial.bairro ? `Bairro: ${filial.bairro}` : undefined,
        },
        {
          key: 'telefone',
          icon: 'phone',
          value: filial.telefone ? `Telefone: ${filial.telefone}` : 'Telefone não informado',
          complement: filial.cnpj ? `CNPJ: ${filial.cnpj}` : undefined,
        },
      ];
    }, [filial]);

  return (
    <View
      style={[
        SearchBarStyles.resultCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[ SearchBarStyles.cardTitle, {color: theme.colors.onSurface}
        ]}
      >
        {filial.codigofilial} -{' '}
        {filial.nomefilial}
      </Text>

      {filial.nomecidade && (
        <Text style={[SearchBarStyles.cardSubtitle, {color: theme.colors.onSurfaceVariant}]}>
          {filial.nomecidade}
        </Text>
      )}

      <View style={[ SearchBarStyles.divider, {backgroundColor: theme.colors.outline}]}/>

      {filialDetails.map(detail => (
        <View key={detail.key} style={SearchBarStyles.detailRow}>
          <MaterialIcons
            name={detail.icon}
            size={19}
            color={theme.colors.iconDefault}
          />

          <View
            style={
              SearchBarStyles.detailContent
            }
          >
            <Text style={[SearchBarStyles.detailValue,{color: theme.colors.onSurface}]}>
              {detail.value}
            </Text>

            {detail.complement && (
              <Text style={[SearchBarStyles.detailComplement, {color: theme.colors.onSurfaceVariant}]}>
                {detail.complement}
              </Text>
            )}
          </View>
        </View>
      ))}

      <View style={[SearchBarStyles.estimateDivider, {backgroundColor: theme.colors.outline} ]}/>

      {loadingEstimate && (
        <View style={SearchBarStyles.estimateContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary}/>

            <Text style={[SearchBarStyles.estimateText, {color: theme.colors.onSurfaceVariant}]}>
                Calculando distância...
            </Text>
        </View>
        )}

        {!loadingEstimate && estimate && (
            <View style={SearchBarStyles.estimateContainer}>
                <View style={[SearchBarStyles.estimateIconContainer, { backgroundColor: theme.colors.primarySoft}]}>

                <MaterialIcons name="directions-car" size={21} color={theme.colors.primary}/>

                </View>

                <View style={SearchBarStyles.estimateContent}>
                <Text style={[ SearchBarStyles.estimateTitle, { color: theme.colors.onSurface}]}>
                    {estimate.durationText}
                </Text>

                <Text style={[SearchBarStyles.estimateDescription, { color: theme.colors.onSurfaceVariant}]} >
                    {estimate.distanceText} da sua localização
                </Text>
                </View>
            </View>
        )}

        {!loadingEstimate &&
        hasLocation &&
        estimateError && (
            <View style={SearchBarStyles.estimateContainer}>
            <MaterialIcons name="route" size={20} color={theme.colors.error}/>

            <Text style={[ SearchBarStyles.estimateError, { color: theme.colors.error}]}>
                {estimateError}
            </Text>
            </View>
        )}

        {!loadingEstimate && !hasLocation && (
            <View style={SearchBarStyles.estimateContainer}>
                <MaterialIcons name="location-off" size={20} color={theme.colors.iconDefault}/>

                <Text style={[ SearchBarStyles.estimateDescription,{color: theme.colors.onSurfaceVariant}]}>
                    Ative a localização para visualizar a estimativa.
                </Text>
            </View>
        )}

      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Adicionar filial ${filial.codigofilial}`}
        style={[SearchBarStyles.addButton, {backgroundColor: theme.colors.primarySoft} ]}
      >
        <MaterialIcons name="add" size={20} color={theme.colors.primary}/>

        <Text style={[SearchBarStyles.addButtonText, {color: theme.colors.primary}]}>
          Adicionar à rota
        </Text>
      </TouchableOpacity>
    </View>
  );
}