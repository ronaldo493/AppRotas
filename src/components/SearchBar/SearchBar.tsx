import { MaterialIcons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import useFiliais from '../../hooks/useFiliais';
import { useAppTheme } from '../ThemeStyles';
import SearchBarStyles from './styles/SearchBarStyles';

interface SearchBarProps {
  onAddRoute: (filial: any) => void;
  onResultChange?: (hasResult: boolean) => void;
}

export default function SearchBar({
  onAddRoute,
  onResultChange,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilial, setSelectedFilial] = useState<any>(null);

  const theme = useAppTheme();
  const { filiais = [], error, loading } = useFiliais();

  const debouncedSearch = useMemo(
    () =>
      debounce((text: string) => {
        const value = text.trim();

        if (!value) {
          setSelectedFilial(null);
          return;
        }

        const codigoFilial = Number(value);

        if (Number.isNaN(codigoFilial)) {
          setSelectedFilial(null);
          return;
        }

        const filialEncontrada = filiais.find(
          (filial: any) => filial.codigofilial === codigoFilial,
        );

        setSelectedFilial(filialEncontrada ?? null);
      }, 400),
    [filiais],
  );

  useEffect(() => {
    onResultChange?.(searchTerm.trim().length > 0);
  }, [searchTerm, onResultChange]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSearch = (text: string) => {
    setSearchTerm(text);

    if (!text.trim()) {
      setSelectedFilial(null);
    }

    debouncedSearch(text);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedFilial(null);
    debouncedSearch.cancel();
  };

  const handleSelectFilial = () => {
    if (!selectedFilial) return;

    onAddRoute(selectedFilial);
    clearSearch();
    Keyboard.dismiss();
  };

  const filialDetails: {
    key: string;
    value: string;
    complement?: string;
  }[] = selectedFilial
    ? [
        {
          key: 'endereco',
          value: `Endereço: ${selectedFilial.endereco}, ${selectedFilial.numero}`,
          complement: `Bairro: ${selectedFilial.bairro}`,
        },
        {
          key: 'telefone',
          value: selectedFilial.telefone || 'Não informado',
          complement:`CNPJ: ${selectedFilial.cnpj}` ,
        },
      ]
    : [];

  return (
    <View>
      <View
        style={[
          SearchBarStyles.inputContainer,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <MaterialIcons
          name="search"
          size={23}
          color={theme.colors.iconDefault}
        />

        <TextInput
          style={[
            SearchBarStyles.input,
            { color: theme.colors.onSurface },
          ]}
          placeholder="Digite o número da filial"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchTerm}
          keyboardType="numeric"
          onChangeText={handleSearch}
          returnKeyType="search"
        />

        {searchTerm.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
          >
            <MaterialIcons
              name="close"
              size={20}
              color={theme.colors.iconDefault}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={SearchBarStyles.feedbackContainer}>
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
          />

          <Text
            style={[
              SearchBarStyles.feedbackText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Carregando filiais...
          </Text>
        </View>
      )}

      {error && (
        <View
          style={[
            SearchBarStyles.errorContainer,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
            },
          ]}
        >
          <Text style={{ color: theme.colors.onErrorContainer }}>
            {error}
          </Text>
        </View>
      )}

      {selectedFilial && (
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
          <View style={SearchBarStyles.cardHeader}>
            <View style={SearchBarStyles.cardHeaderContent}>
              <Text
                numberOfLines={2}
                style={[SearchBarStyles.cardTitle, { color: theme.colors.onSurface },]}
              >
                {selectedFilial.nomefilial}
              </Text>
            </View>
          </View>

          <View style={[SearchBarStyles.divider, { backgroundColor: theme.colors.outline },]}/>

          {filialDetails.map(detail => (
            <View key={detail.key} style={SearchBarStyles.detailRow}>
              <MaterialIcons size={19} color={theme.colors.iconDefault}/>

              <View style={SearchBarStyles.detailContent}>
                <Text style={[SearchBarStyles.detailValue, { color: theme.colors.onSurface },]}>
                  {detail.value}
                </Text>

                {detail.complement && (
                  <Text style={[ SearchBarStyles.detailComplement, { color: theme.colors.onSurfaceVariant },]}>
                    {detail.complement}
                  </Text>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSelectFilial}
            activeOpacity={0.8}
            style={[
              SearchBarStyles.addButton,
              { backgroundColor: theme.colors.primarySoft },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar filial ${selectedFilial.codigofilial}`}
          >
            <MaterialIcons
              name="add"
              size={20}
              color={theme.colors.primary}
            />

            <Text
              style={[
                SearchBarStyles.addButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Adicionar à rota
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}