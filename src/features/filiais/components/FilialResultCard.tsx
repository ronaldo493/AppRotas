import {MaterialIcons} from '@expo/vector-icons';
import React, {useMemo} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {Filial} from '../models/Filial';
import SearchBarStyles from './filialSearch.styles';

interface FilialResultCardProps {
  filial: Filial;
  onAdd: () => void;
}

interface FilialDetail {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  complement?: string;
}

/**
 * Exibe os dados cadastrais da filial encontrada. A estimativa não é
 * consultada durante a busca; ela pertence exclusivamente à prévia da rota.
 */
export default function FilialResultCard({
  filial,
  onAdd,
}: FilialResultCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const filialDetails =
    useMemo<FilialDetail[]>(() => {
      const address = [
        filial.endereco,
        filial.numero,
      ]
        .filter(Boolean)
        .join(', ');

      return [
        {
          key: 'endereco',
          icon: 'location-on',
          value: address
            ? `Endereço: ${address}`
            : 'Endereço não informado',
          complement: filial.bairro
            ? `Bairro: ${filial.bairro}`
            : undefined,
        },
        {
          key: 'telefone',
          icon: 'phone',
          value: filial.telefone
            ? `Telefone: ${filial.telefone}`
            : 'Telefone não informado',
          complement: filial.cnpj
            ? `CNPJ: ${filial.cnpj}`
            : undefined,
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
        style={[
          SearchBarStyles.cardTitle,
          {color: theme.colors.onSurface},
        ]}
      >
        {filial.codigofilial} - {filial.nomefilial}
      </Text>

      {filial.nomecidade ? (
        <Text
          style={[
            SearchBarStyles.cardSubtitle,
            {
              color:
                theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {filial.nomecidade}
        </Text>
      ) : null}

      <View
        style={[
          SearchBarStyles.divider,
          {backgroundColor: theme.colors.outline},
        ]}
      />

      {filialDetails.map(detail => (
        <View
          key={detail.key}
          style={SearchBarStyles.detailRow}
        >
          <MaterialIcons
            name={detail.icon}
            size={19}
            color={theme.colors.iconDefault}
          />

          <View style={SearchBarStyles.detailContent}>
            <Text
              style={[
                SearchBarStyles.detailValue,
                {color: theme.colors.onSurface},
              ]}
            >
              {detail.value}
            </Text>

            {detail.complement ? (
              <Text
                style={[
                  SearchBarStyles.detailComplement,
                  {
                    color:
                      theme.colors
                        .onSurfaceVariant,
                  },
                ]}
              >
                {detail.complement}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Adicionar filial ${filial.codigofilial}`}
        style={[
          SearchBarStyles.addButton,
          {
            backgroundColor:
              theme.colors.primarySoft,
          },
        ]}
      >
        <MaterialIcons
          name="add"
          size={20}
          color={theme.colors.primary}
        />

        <Text
          style={[
            SearchBarStyles.addButtonText,
            {color: theme.colors.primary},
          ]}
        >
          Adicionar à rota
        </Text>
      </TouchableOpacity>
    </View>
  );
}
