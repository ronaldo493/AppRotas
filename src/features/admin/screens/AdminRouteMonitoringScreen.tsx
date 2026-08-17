import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import AdminDashboardFilters from '../components/AdminDashboardFilters';
import AdminDashboardSummary from '../components/AdminDashboardSummary';
import AdminModuleHeader from '../components/AdminModuleHeader';
import AdminRouteDetailSheet from '../components/AdminRouteDetailSheet';
import AdminRouteExecutionCard from '../components/AdminRouteExecutionCard';
import useAdminRouteDashboard from '../hooks/useAdminRouteDashboard';
import type {ExecucaoRotaAdmin} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';
import AdminRouteMapScreen from './AdminRouteMapScreen';

export default function AdminRouteMonitoringScreen({
  onBack,
}: {
  onBack: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const [execucaoSelecionada, setExecucaoSelecionada] =
    useState<ExecucaoRotaAdmin | null>(null);
  const [execucaoMapa, setExecucaoMapa] =
    useState<ExecucaoRotaAdmin | null>(null);
  const painel = useAdminRouteDashboard();
  const backHeader = (
    <View style={styles.stateBackHeader}>
      <AdminModuleHeader onBack={onBack} />
    </View>
  );

  const renderExecucao = useCallback(
    ({item}: ListRenderItemInfo<ExecucaoRotaAdmin>): React.JSX.Element => (
      <AdminRouteExecutionCard
        execucao={item}
        onPress={() => setExecucaoSelecionada(item)}
      />
    ),
    [],
  );

  if (painel.loading && !painel.dados) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        {backHeader}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateDescription, {color: theme.colors.onSurfaceVariant}]}>
            Carregando monitoramento...
          </Text>
        </View>
      </View>
    );
  }

  if (painel.error && !painel.dados) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        {backHeader}
        <View style={styles.centered}>
          <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
            Não foi possível abrir o painel
          </Text>
          <Text style={[styles.stateDescription, {color: theme.colors.onSurfaceVariant}]}>
            {painel.error}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void painel.tentarNovamente()}
            style={[styles.retryButton, {backgroundColor: theme.colors.actionBackground}]}
          >
            <Text style={[styles.retryText, {color: theme.colors.actionForeground}]}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!painel.dados) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        {backHeader}
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.moduleHeader}>
        <AdminModuleHeader
          title="Monitoramento de rotas"
          scope={painel.dados.escopo.abrangencia === 'todos_setores'
            ? 'Todos os setores'
            : painel.dados.escopo.setor ?? 'Setor não informado'}
          onBack={onBack}
        />
      </View>

      <AdminDashboardFilters
        filtros={painel.filtros}
        disabled={painel.loading || painel.loadingMore}
        onApply={painel.aplicarFiltros}
      />

      {painel.loading && (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.filterLoading}
        />
      )}

      {painel.error && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => void painel.tentarNovamente()}
          style={styles.inlineError}
        >
          <Text style={[styles.inlineErrorText, {color: theme.colors.primary}]}>
            {painel.error} Toque para tentar novamente.
          </Text>
        </TouchableOpacity>
      )}

      <AdminDashboardSummary dados={painel.dados} />

      <View style={styles.listHeading}>
        <Text style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>
          Percursos
        </Text>
        <Text style={[styles.sectionAside, {color: theme.colors.onSurfaceVariant}]}>
          {painel.dados.paginacao.total} {painel.dados.paginacao.total === 1 ? 'registro' : 'registros'}
        </Text>
      </View>
    </>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={painel.dados.execucoes}
        keyExtractor={item => item.codigoSessao}
        renderItem={renderExecucao}
        onEndReached={painel.carregarMais}
        onEndReachedThreshold={0.35}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          painel.dados.execucoes.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={(
          <RefreshControl
            refreshing={painel.refreshing}
            onRefresh={() => void painel.atualizar()}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
              Nenhum percurso encontrado
            </Text>
            <Text style={[styles.stateDescription, {color: theme.colors.onSurfaceVariant}]}>
              Altere o período, a situação ou a pesquisa.
            </Text>
          </View>
        )}
        ListFooterComponent={painel.loadingMore ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.loadingFooter}
          />
        ) : null}
      />

      <AdminRouteDetailSheet
        execucao={execucaoSelecionada}
        onClose={() => setExecucaoSelecionada(null)}
        onViewMap={() => {
          if (!execucaoSelecionada) return;
          setExecucaoMapa(execucaoSelecionada);
          setExecucaoSelecionada(null);
        }}
      />

      <AdminRouteMapScreen
        codigoSessao={execucaoMapa?.codigoSessao ?? null}
        nomeColaborador={execucaoMapa?.username ?? null}
        onClose={() => setExecucaoMapa(null)}
      />
    </View>
  );
}
