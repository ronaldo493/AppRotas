import React, {useEffect, useState} from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {
  FiltroSituacaoAdmin,
  PeriodoPainelAdmin,
} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';

const PERIODOS: Array<{valor: PeriodoPainelAdmin; rotulo: string}> = [
  {valor: 'hoje', rotulo: 'Hoje'},
  {valor: '7_dias', rotulo: '7 dias'},
  {valor: '30_dias', rotulo: '30 dias'},
];

const SITUACOES: Array<{valor: FiltroSituacaoAdmin; rotulo: string}> = [
  {valor: 'todas', rotulo: 'Todas as situações'},
  {valor: 'em_andamento', rotulo: 'Em andamento'},
  {valor: 'concluida', rotulo: 'Concluídas'},
  {valor: 'concluida_parcial', rotulo: 'Concluídas parcialmente'},
  {valor: 'interrompida', rotulo: 'Interrompidas'},
  {valor: 'cancelada', rotulo: 'Canceladas'},
];

interface Props {
  periodo: PeriodoPainelAdmin;
  situacao: FiltroSituacaoAdmin;
  busca: string;
  disabled: boolean;
  onPeriodoChange: (periodo: PeriodoPainelAdmin) => void;
  onSituacaoChange: (situacao: FiltroSituacaoAdmin) => void;
  onBuscaChange: (busca: string) => void;
}

/** Mantém período, pesquisa e situação em uma única área compacta. */
export default function AdminDashboardFilters({
  periodo,
  situacao,
  busca,
  disabled,
  onPeriodoChange,
  onSituacaoChange,
  onBuscaChange,
}: Props): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rascunhoBusca, setRascunhoBusca] = useState(busca);
  const [situacoesVisible, setSituacoesVisible] = useState(false);

  useEffect(() => setRascunhoBusca(busca), [busca]);

  const aplicarBusca = (): void => {
    onBuscaChange(rascunhoBusca.replace(/\s+/g, ' ').trim());
  };

  const situacaoAtual = SITUACOES.find(item => item.valor === situacao)
    ?? SITUACOES[0];

  return (
    <View style={styles.filters}>
      <View
        style={[
          styles.periodSelector,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
        ]}
      >
        {PERIODOS.map(item => {
          const ativo = periodo === item.valor;
          return (
            <TouchableOpacity
              key={item.valor}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onPeriodoChange(item.valor)}
              style={[
                styles.periodOption,
                ativo && {backgroundColor: theme.colors.primarySoft},
              ]}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  {color: ativo ? theme.colors.primary : theme.colors.onSurfaceVariant},
                ]}
              >
                {item.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={rascunhoBusca}
          editable={!disabled}
          returnKeyType="search"
          placeholder="Colaborador, setor, cidade ou sessão"
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
          disabled={disabled}
          onPress={aplicarBusca}
          style={[styles.searchButton, {backgroundColor: theme.colors.actionBackground}]}
        >
          <Text style={[styles.searchButtonText, {color: theme.colors.actionForeground}]}>
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => setSituacoesVisible(true)}
        style={[styles.statusFilter, {borderColor: theme.colors.outline}]}
      >
        <Text style={[styles.statusFilterLabel, {color: theme.colors.onSurfaceVariant}]}>
          Situação
        </Text>
        <Text style={[styles.statusFilterValue, {color: theme.colors.onSurface}]}>
          {situacaoAtual.rotulo}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="slide"
        visible={situacoesVisible}
        onRequestClose={() => setSituacoesVisible(false)}
      >
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtro de situação"
            onPress={() => setSituacoesVisible(false)}
            style={styles.backdrop}
          />

          <View
            style={[
              styles.filterSheet,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={[styles.sheetHandle, {backgroundColor: theme.colors.outline}]} />
            <Text style={[styles.filterSheetTitle, {color: theme.colors.onSurface}]}>
              Filtrar por situação
            </Text>

            {SITUACOES.map(item => {
              const selecionada = situacao === item.valor;
              return (
                <TouchableOpacity
                  key={item.valor}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSituacaoChange(item.valor);
                    setSituacoesVisible(false);
                  }}
                  style={[
                    styles.filterSheetOption,
                    selecionada && {backgroundColor: theme.colors.primarySoft},
                  ]}
                >
                  <Text
                    style={[
                      styles.filterSheetOptionText,
                      {color: selecionada ? theme.colors.primary : theme.colors.onSurface},
                    ]}
                  >
                    {item.rotulo}
                  </Text>
                  {selecionada && (
                    <Text style={[styles.filterSheetSelected, {color: theme.colors.primary}]}>
                      Selecionada
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}
