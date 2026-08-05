import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import AdminModuleHeader from '../components/AdminModuleHeader';
import AdminPasswordResetSheet from '../components/AdminPasswordResetSheet';
import AdminUserListItem from '../components/AdminUserListItem';
import useAdminPasswordManagement from '../hooks/useAdminPasswordManagement';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';
import styles from '../styles/adminPasswordManagement.styles';

/** Seleção e confirmação da redefinição administrativa de senha. */
export default function AdminPasswordManagementScreen({
  onBack,
}: {
  onBack: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const gestao = useAdminPasswordManagement();
  const [rascunhoBusca, setRascunhoBusca] = useState(gestao.busca);
  const [selecionado, setSelecionado] = useState<UsuarioAdministravel | null>(null);

  useEffect(() => setRascunhoBusca(gestao.busca), [gestao.busca]);

  const aplicarBusca = (): void => {
    gestao.setBusca(rascunhoBusca.replace(/\s+/g, ' ').trim());
  };

  const renderUsuario = useCallback(({
    item,
  }: ListRenderItemInfo<UsuarioAdministravel>): React.JSX.Element => (
    <AdminUserListItem
      usuario={item}
      disabled={gestao.redefinindoId !== null}
      onPress={() => setSelecionado(item)}
    />
  ), [gestao.redefinindoId]);

  const header = (
    <>
      <View style={styles.moduleHeader}>
        <AdminModuleHeader
          title="Trocar senha"
          scope={gestao.dados?.escopo.abrangencia === 'todos_setores'
            ? 'Todos os setores'
            : gestao.dados?.escopo.setor ?? 'Seu setor'}
          onBack={onBack}
        />
      </View>

      <Text style={[styles.instructions, {color: theme.colors.onSurfaceVariant}]}>
        Localize o colaborador e confirme a redefinição. A troca definitiva será feita pelo próprio usuário.
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          value={rascunhoBusca}
          editable={!gestao.loading}
          returnKeyType="search"
          placeholder="Nome, setor ou cargo"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onChangeText={setRascunhoBusca}
          onSubmitEditing={aplicarBusca}
          style={[
            styles.searchInput,
            {
              color: theme.colors.onSurface,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={gestao.loading}
          onPress={aplicarBusca}
          style={[styles.searchButton, {backgroundColor: theme.colors.actionBackground}]}
        >
          <Text style={[styles.searchButtonText, {color: theme.colors.actionForeground}]}>
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      {gestao.loading && gestao.dados && (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.inlineLoading}
        />
      )}

      {gestao.error && gestao.dados && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => void gestao.tentarNovamente()}
          style={styles.inlineError}
        >
          <Text style={[styles.inlineErrorText, {color: theme.colors.primary}]}>
            {gestao.error} Toque para tentar novamente.
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.listHeading}>
        <Text style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>
          Usuários
        </Text>
        <Text style={[styles.sectionAside, {color: theme.colors.onSurfaceVariant}]}>
          {gestao.dados?.paginacao.total ?? 0} encontrados
        </Text>
      </View>
    </>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={gestao.dados?.usuarios ?? []}
        keyExtractor={item => String(item.id)}
        renderItem={renderUsuario}
        onEndReached={gestao.carregarMais}
        onEndReachedThreshold={0.35}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={(
          <RefreshControl
            refreshing={gestao.refreshing}
            onRefresh={() => void gestao.atualizar()}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={gestao.loading ? (
          <View style={styles.state}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
              Carregando usuários...
            </Text>
          </View>
        ) : gestao.error ? (
          <View style={styles.state}>
            <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
              Não foi possível carregar os usuários
            </Text>
            <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
              {gestao.error}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void gestao.tentarNovamente()}
              style={[styles.retryButton, {backgroundColor: theme.colors.actionBackground}]}
            >
              <Text style={[styles.retryButtonText, {color: theme.colors.actionForeground}]}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.state}>
            <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
              Nenhum usuário encontrado
            </Text>
            <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
              Verifique o nome informado e tente novamente.
            </Text>
          </View>
        )}
        ListFooterComponent={gestao.loadingMore ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.loadingFooter}
          />
        ) : null}
      />

      <AdminPasswordResetSheet
        usuario={selecionado}
        loading={selecionado?.id === gestao.redefinindoId}
        onClose={() => setSelecionado(null)}
        onConfirm={() => {
          if (!selecionado) return;
          void gestao.redefinirSenha(selecionado).then(redefinida => {
            if (redefinida) setSelecionado(null);
          });
        }}
      />
    </View>
  );
}
