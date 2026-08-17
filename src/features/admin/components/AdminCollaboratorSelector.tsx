import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import useAdminCollaboratorOptions from '../hooks/useAdminCollaboratorOptions';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';
import styles from '../styles/adminDashboard.styles';

/** Lista paginada de colaboradores; a seleção vazia representa todas as rotas. */
export default function AdminCollaboratorSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (username: string) => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const [busca, setBusca] = useState('');
  const diretorio = useAdminCollaboratorOptions(true, busca);

  const selecionar = (username: string): void => {
    Keyboard.dismiss();
    onSelect(username);
  };

  const renderUsuario = ({item}: ListRenderItemInfo<UsuarioAdministravel>) => {
    const selecionado = selected === item.username;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => selecionar(item.username)}
        style={[
          styles.collaboratorListItem,
          selecionado && {backgroundColor: theme.colors.primarySoft},
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.collaboratorName,
            {color: selecionado ? theme.colors.primary : theme.colors.onSurface},
          ]}
        >
          {item.username}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.collaboratorSector, {color: theme.colors.onSurfaceVariant}]}
        >
          {item.setor}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.collaboratorSelectorScreen}>
      <TextInput
        value={busca}
        autoFocus
        returnKeyType="search"
        placeholder="Digite o nome do colaborador"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        onChangeText={setBusca}
        style={[
          styles.searchInput,
          {
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      />

      <FlatList
        data={diretorio.usuarios}
        keyExtractor={item => String(item.id)}
        renderItem={renderUsuario}
        onEndReached={diretorio.carregarMais}
        onEndReachedThreshold={0.35}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.collaboratorListContent}
        ListHeaderComponent={(
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selecionar('')}
            style={[
              styles.collaboratorListItem,
              !selected && {backgroundColor: theme.colors.primarySoft},
            ]}
          >
            <Text
              style={[
                styles.collaboratorName,
                {color: !selected ? theme.colors.primary : theme.colors.onSurface},
              ]}
            >
              Todos os colaboradores
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={diretorio.loading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.collaboratorListState}
          />
        ) : diretorio.error ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void diretorio.tentarNovamente()}
            style={styles.collaboratorListState}
          >
            <Text style={[styles.collaboratorStateText, {color: theme.colors.primary}]}>
              Não foi possível carregar. Toque para tentar novamente.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.collaboratorListState}>
            <Text style={[styles.collaboratorStateText, {color: theme.colors.onSurfaceVariant}]}>
              Nenhum colaborador encontrado.
            </Text>
          </View>
        )}
        ListFooterComponent={diretorio.loadingMore ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.collaboratorListFooter}
          />
        ) : null}
      />
    </View>
  );
}
