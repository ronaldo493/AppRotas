import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, ListRenderItemInfo, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import FiltroPeriodoHistorico from '../components/FiltroPeriodoHistorico';
import HistoricoCard from '../components/HistoricoCard';
import useHistoricoRotas from '../hooks/useHistoricoRotas';
import type {HistoricoVisita} from '../models/Historico';
import HistoricoStyles from './historicoScreen.styles';

export default function HistoricoScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const {
    historicosRotas,
    filtro,
    loading,
    hasMore,
    loadMore,
    aplicarFiltroData,
    limparFiltroData,
  } = useHistoricoRotas();

  const possuiFiltro = Boolean(filtro.dataInicial || filtro.dataFinal);

  const renderHistorico = useCallback(({item}: ListRenderItemInfo<HistoricoVisita>): React.JSX.Element => (
      <HistoricoCard item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: HistoricoVisita): string =>
      item.documentId ?? String(item.id),
    [],
  );

  return (
    <View style={[ HistoricoStyles.container, {backgroundColor: theme.colors.background}]}>
      <FiltroPeriodoHistorico
        filtro={filtro}
        loading={loading}
        onAplicar={aplicarFiltroData}
        onLimpar={limparFiltroData}
      />

      <FlatList<HistoricoVisita>
        data={historicosRotas}
        renderItem={renderHistorico}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          HistoricoStyles.listContent,
          historicosRotas.length === 0 &&
            HistoricoStyles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={HistoricoStyles.emptyState}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.primary}/>

                <Text style={[ HistoricoStyles.loadingText, { color: theme.colors .onSurfaceVariant}]}>
                  Carregando histórico...
                </Text>
              </>
            ) : (
              <>
                <Text style={[ HistoricoStyles.emptyTitle, { color: theme.colors.onBackground }]}>
                  Nenhuma rota encontrada
                </Text>

                <Text style={[ HistoricoStyles.emptyDescription, { color: theme.colors.onSurfaceVariant}]}>
                  {possuiFiltro
                    ? 'Nenhum histórico foi encontrado no período selecionado.'
                    : 'As rotas traçadas aparecerão aqui.'}
                </Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          loading && historicosRotas.length > 0 ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={HistoricoStyles.footerLoading}
            />
          ) : !hasMore &&
            historicosRotas.length > 0 ? (
            <Text style={[HistoricoStyles.endText, { color: theme.colors.onSurfaceVariant}]}>
              Fim do histórico
            </Text>
          ) : null
        }
      />
    </View>
  );
}
