import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {
  AgrupamentoDistribuicaoFiliais,
  FiltroDistribuicaoFiliais,
  ItemDistribuicaoFiliais,
  ResumoDistribuicaoFiliais,
} from '../useCases/analisarDistribuicaoFiliais';
import styles from './distribuicaoFiliaisSheet.styles';

interface DistribuicaoFiliaisSheetProps {
  visible: boolean;
  resumo: ResumoDistribuicaoFiliais;
  filtro: FiltroDistribuicaoFiliais | null;
  onDismiss: () => void;
  onSelect: (
    tipo: AgrupamentoDistribuicaoFiliais,
    item: ItemDistribuicaoFiliais,
  ) => void;
  onClear: () => void;
}

/** Mostra o ranking e transforma uma seleção em filtro explícito do mapa. */
export default function DistribuicaoFiliaisSheet({
  visible,
  resumo,
  filtro,
  onDismiss,
  onSelect,
  onClear,
}: DistribuicaoFiliaisSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [agrupamento, setAgrupamento] =
    useState<AgrupamentoDistribuicaoFiliais>('cidade');

  useEffect(() => {
    if (visible && filtro) setAgrupamento(filtro.tipo);
  }, [filtro, visible]);

  const itens = agrupamento === 'cidade' ? resumo.cidades : resumo.estados;
  const maiorQuantidade = itens[0]?.quantidade ?? 1;

  const handleSelect = useCallback(
    (item: ItemDistribuicaoFiliais): void => {
      onSelect(agrupamento, item);
      onDismiss();
    },
    [agrupamento, onDismiss, onSelect],
  );

  const handleClear = useCallback((): void => {
    onClear();
    onDismiss();
  }, [onClear, onDismiss]);

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<ItemDistribuicaoFiliais>) => {
      const selecionado =
        filtro?.tipo === agrupamento && filtro.chave === item.chave;
      const largura = `${Math.max(5, (item.quantidade / maiorQuantidade) * 100)}%` as const;
      const percentual = item.percentual.toLocaleString('pt-BR', {
        maximumFractionDigits: 1,
      });

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{selected: selecionado}}
          style={[
            styles.item,
            selecionado && {backgroundColor: theme.colors.primarySoft},
          ]}
          onPress={() => handleSelect(item)}
        >
          <Text
            style={[
              styles.position,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            {index + 1}
          </Text>
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text
                numberOfLines={1}
                style={[
                  styles.itemLabel,
                  {color: selecionado ? theme.colors.primary : theme.colors.onSurface},
                ]}
              >
                {item.rotulo}
              </Text>
              <Text
                style={[
                  styles.itemValue,
                  {color: theme.colors.onSurfaceVariant},
                ]}
              >
                {item.quantidade} {item.quantidade === 1 ? 'filial' : 'filiais'} · {percentual}%
              </Text>
            </View>
            <View
              style={[
                styles.barTrack,
                {backgroundColor: theme.colors.surfaceVariant},
              ]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    width: largura,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      agrupamento,
      filtro,
      handleSelect,
      maiorQuantidade,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
      theme.colors.primarySoft,
      theme.colors.surfaceVariant,
    ],
  );

  const emptyMessage = useMemo(
    () =>
      agrupamento === 'estado'
        ? 'Os estados ainda não estão informados no cadastro das filiais.'
        : 'Não há cidades disponíveis para esta análise.',
    [agrupamento],
  );

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="slide"
      visible={visible}
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar distribuição"
          style={[
            styles.backdrop,
            {backgroundColor: theme.colors.backdrop},
          ]}
          onPress={onDismiss}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View
            style={[styles.handle, {backgroundColor: theme.colors.outline}]}
          />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, {color: theme.colors.onSurface}]}>
                Distribuição das filiais
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {color: theme.colors.onSurfaceVariant},
                ]}
              >
                {resumo.totalFiliais} filiais · {resumo.totalCidades} cidades · {resumo.totalEstados} estados
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.closeButton}
              onPress={onDismiss}
            >
              <Text style={[styles.closeText, {color: theme.colors.primary}]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.tabs,
              {backgroundColor: theme.colors.surfaceVariant},
            ]}
          >
            {(['cidade', 'estado'] as const).map(tipo => {
              const ativo = agrupamento === tipo;

              return (
                <TouchableOpacity
                  key={tipo}
                  activeOpacity={0.72}
                  accessibilityRole="tab"
                  accessibilityState={{selected: ativo}}
                  style={[
                    styles.tab,
                    ativo && {backgroundColor: theme.colors.surface},
                  ]}
                  onPress={() => setAgrupamento(tipo)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: ativo
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Por {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filtro ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.clearFilter}
              onPress={handleClear}
            >
              <Text style={[styles.clearFilterText, {color: theme.colors.primary}]}>
                Mostrar todas as filiais
              </Text>
            </TouchableOpacity>
          ) : null}

          <FlatList
            data={itens}
            renderItem={renderItem}
            keyExtractor={item => item.chave}
            style={styles.list}
            contentContainerStyle={itens.length === 0 ? styles.emptyList : styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text
                style={[
                  styles.emptyText,
                  {color: theme.colors.onSurfaceVariant},
                ]}
              >
                {emptyMessage}
              </Text>
            }
          />

          <Text
            style={[
              styles.hint,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            Toque em uma linha para filtrar o mapa.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
