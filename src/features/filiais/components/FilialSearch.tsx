import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {Filial} from '../models/Filial';
import {useAppTheme} from '../../../core/theme/appTheme';
import FilialResultCard from './FilialResultCard';
import useSearchFilial from '../hooks/useFilialSearch';
import SearchBarStyles from './filialSearch.styles';

interface SearchBarProps {
  onAddRoute: (filial: Filial) => void;
  onResultChange?: (
    hasSearch: boolean,
  ) => void;
  filiais: readonly Filial[];
  loadingFiliais: boolean;
  filiaisError: string | null;
  usandoDadosSalvos: boolean;
  dadosOnlineIndisponiveis: boolean;
  cacheAtualizadoEm: number | null;
}

export default function SearchBar({
  onAddRoute,
  onResultChange,
  filiais,
  loadingFiliais,
  filiaisError,
  usandoDadosSalvos,
  dadosOnlineIndisponiveis,
  cacheAtualizadoEm,
}: SearchBarProps): React.JSX.Element {
  const theme = useAppTheme();
  const cacheDate = cacheAtualizadoEm
    ? new Date(cacheAtualizadoEm).toLocaleDateString('pt-BR')
    : null;

  const {
    searchTerm,
    handleSearch,
    clearSearch,

    selectedFilial,
    filialNotFound,
    addSelectedFilial,

  } = useSearchFilial({
    onAddRoute,
    onResultChange,
    filiais,
    filiaisError,
    loadingFiliais,
  });

  const handleClear = (): void => {
    clearSearch();
    Keyboard.dismiss();
  };

  return (
    <View>
      <View
        style={[
          SearchBarStyles.inputContainer,
          {
            backgroundColor:
              theme.colors.surfaceVariant,
            borderColor:
              theme.colors.outline,
          },
        ]}
      >
        <MaterialIcons
          name="search"
          size={23}
          color={theme.colors.iconDefault}
        />

        <TextInput
          value={searchTerm}
          onChangeText={handleSearch}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder="Digite o número da filial"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType="numeric"
          returnKeyType="search"
          style={[SearchBarStyles.input, { color: theme.colors.onSurface}]}
        />

        {searchTerm.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            activeOpacity={0.7}
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

      {loadingFiliais && (
        <View style={SearchBarStyles.feedbackContainer}>

          <ActivityIndicator size="small" color={theme.colors.primary}/>

          <Text style={[SearchBarStyles.feedbackText, {color: theme.colors.onSurfaceVariant }]}>
            Carregando filiais...
          </Text>
        </View>
      )}

      {filiaisError && (
        <View
          style={[
            SearchBarStyles.errorContainer,
            {
              backgroundColor: theme.colors.errorContainer,
              borderColor: theme.colors.error,
            },
          ]}
        >
          <Text style={{color: theme.colors.onErrorContainer}}>
            {filiaisError}
          </Text>
        </View>
      )}

      {usandoDadosSalvos && !filiaisError && (
        <View
          style={[
            SearchBarStyles.offlineContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <Text
            style={[
              SearchBarStyles.offlineText,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            {dadosOnlineIndisponiveis
              ? 'Sem conexão: usando filiais salvas'
              : 'Usando filiais salvas enquanto verifica atualizações'}.
            {cacheDate
              ? ` Última atualização: ${cacheDate}.`
              : ''}
          </Text>
        </View>
      )}

      {filialNotFound && (
        <View
          style={[
            SearchBarStyles.notFoundContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <MaterialIcons
            name="search-off"
            size={24}
            color={theme.colors.iconDefault}
          />

          <View style={SearchBarStyles.notFoundContent}>
            <Text
              style={[
                SearchBarStyles.notFoundTitle,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              Filial não encontrada
            </Text>

            <Text
              style={[
                SearchBarStyles.notFoundText,
                {
                  color:
                    theme.colors
                      .onSurfaceVariant,
                },
              ]}
            >
              Não encontramos a filial{' '}
              {searchTerm.trim()}.
            </Text>
          </View>
        </View>
      )}

      {selectedFilial && (
        <FilialResultCard
          filial={selectedFilial}
          onAdd={addSelectedFilial}
        />
      )}
    </View>
  );
}
