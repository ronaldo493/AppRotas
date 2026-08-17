import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import React, {useEffect, useState} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import AdminCollaboratorSelector from './AdminCollaboratorSelector';
import type {
  FiltrosPainelAdmin,
  FiltroResultadoViagemAdmin,
  PeriodoPainelAdmin,
} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';
import {
  criarDatasPeriodoAdmin,
  MAXIMO_DIAS_PERIODO_ADMIN,
} from '../useCases/formatAdminRouteDashboard';

type CampoData = 'inicial' | 'final' | null;

const ATALHOS: Array<{valor: PeriodoPainelAdmin; rotulo: string}> = [
  {valor: 'hoje', rotulo: 'Hoje'},
  {valor: '7_dias', rotulo: '7 dias'},
  {valor: '30_dias', rotulo: '30 dias'},
];

const RESULTADOS: Array<{valor: FiltroResultadoViagemAdmin; rotulo: string}> = [
  {valor: 'todas', rotulo: 'Todos os resultados'},
  {valor: 'em_acompanhamento', rotulo: 'Em andamento'},
  {valor: 'percorrida_confirmada', rotulo: 'Percurso confirmado'},
  {valor: 'percorrida_parcial', rotulo: 'Percurso parcial'},
  {valor: 'interrompida', rotulo: 'Interrompida'},
  {valor: 'evidencia_insuficiente', rotulo: 'Evidência insuficiente'},
  {valor: 'nao_iniciada', rotulo: 'Não iniciada'},
];

const mesmoDia = (primeira: Date, segunda: Date): boolean =>
  primeira.getFullYear() === segunda.getFullYear()
  && primeira.getMonth() === segunda.getMonth()
  && primeira.getDate() === segunda.getDate();

const adicionarDias = (data: Date, quantidade: number): Date => {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + quantidade);
  return resultado;
};

function DateField({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: Date;
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.adminDateField,
        {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
      ]}
    >
      <Text style={[styles.adminDateLabel, {color: theme.colors.onSurfaceVariant}]}>
        {label}
      </Text>
      <Text style={[styles.adminDateValue, {color: theme.colors.onSurface}]}>
        {value.toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );
}

/** Mantém a tela principal limpa e concentra toda a edição em um único painel. */
export default function AdminDashboardFilters({
  filtros,
  disabled,
  onApply,
}: {
  filtros: FiltrosPainelAdmin;
  disabled: boolean;
  onApply: (filtros: FiltrosPainelAdmin) => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rascunho, setRascunho] = useState(filtros);
  const [visible, setVisible] = useState(false);
  const [picker, setPicker] = useState<CampoData>(null);
  const [collaboratorsVisible, setCollaboratorsVisible] = useState(false);
  const hoje = new Date();

  useEffect(() => setRascunho(filtros), [filtros]);

  const resultadoAplicado = RESULTADOS.find(
    item => item.valor === filtros.resultado,
  ) ?? RESULTADOS[0];
  const possuiAlteracoes =
    !mesmoDia(rascunho.dataInicial, filtros.dataInicial)
    || !mesmoDia(rascunho.dataFinal, filtros.dataFinal)
    || rascunho.resultado !== filtros.resultado
    || rascunho.busca.trim() !== filtros.busca;
  const resumoAdicional = filtros.busca
    ? `${resultadoAplicado.rotulo} · Colaborador: ${filtros.busca}`
    : resultadoAplicado.rotulo;

  const abrir = (): void => {
    setRascunho(filtros);
    setPicker(null);
    setCollaboratorsVisible(false);
    setVisible(true);
  };

  const fechar = (): void => {
    setRascunho(filtros);
    setPicker(null);
    setCollaboratorsVisible(false);
    setVisible(false);
  };

  const aplicar = (): void => {
    onApply({
      ...rascunho,
      busca: rascunho.busca.replace(/\s+/g, ' ').trim(),
    });
    setPicker(null);
    setCollaboratorsVisible(false);
    setVisible(false);
  };

  const limpar = (): void => {
    setRascunho({
      ...criarDatasPeriodoAdmin('hoje'),
      resultado: 'todas',
      busca: '',
    });
  };

  const selecionarAtalho = (periodo: PeriodoPainelAdmin): void => {
    setRascunho(atual => ({...atual, ...criarDatasPeriodoAdmin(periodo)}));
  };

  const alterarData = (
    event: DateTimePickerEvent,
    dataSelecionada?: Date,
  ): void => {
    const campo = picker;
    setPicker(null);
    if (event.type === 'dismissed' || !dataSelecionada || !campo) return;

    setRascunho(atual => {
      if (campo === 'inicial') {
        const limiteFinal = adicionarDias(
          dataSelecionada,
          MAXIMO_DIAS_PERIODO_ADMIN - 1,
        );
        const dataFinal = atual.dataFinal.getTime() < dataSelecionada.getTime()
          ? dataSelecionada
          : atual.dataFinal.getTime() > limiteFinal.getTime()
            ? limiteFinal
            : atual.dataFinal;
        return {...atual, dataInicial: dataSelecionada, dataFinal};
      }

      const limiteInicial = adicionarDias(
        dataSelecionada,
        -(MAXIMO_DIAS_PERIODO_ADMIN - 1),
      );
      const dataInicial = atual.dataInicial.getTime() > dataSelecionada.getTime()
        ? dataSelecionada
        : atual.dataInicial.getTime() < limiteInicial.getTime()
          ? limiteInicial
          : atual.dataInicial;
      return {...atual, dataInicial, dataFinal: dataSelecionada};
    });
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={abrir}
        style={[
          styles.appliedFilters,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
        ]}
      >
        <View style={styles.appliedFiltersContent}>
          <Text style={[styles.appliedFiltersLabel, {color: theme.colors.onSurfaceVariant}]}>
            Período
          </Text>
          <Text style={[styles.appliedFiltersPeriod, {color: theme.colors.onSurface}]}>
            {filtros.dataInicial.toLocaleDateString('pt-BR')} até {filtros.dataFinal.toLocaleDateString('pt-BR')}
          </Text>
          <Text numberOfLines={1} style={[styles.appliedFiltersMeta, {color: theme.colors.onSurfaceVariant}]}>
            {resumoAdicional}
          </Text>
        </View>
        <Text style={[styles.appliedFiltersAction, {color: theme.colors.primary}]}>
          Filtrar
        </Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="slide"
        visible={visible}
        onRequestClose={fechar}
      >
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros"
            onPress={fechar}
            style={styles.backdrop}
          />

          <View
            style={[
              styles.filterSheet,
              {
                backgroundColor: theme.colors.background,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={[styles.sheetHandle, {backgroundColor: theme.colors.outline}]} />
            <View style={styles.filterSheetHeader}>
              <Text style={[styles.filterSheetTitle, {color: theme.colors.onBackground}]}>
                Filtrar percursos
              </Text>
              <TouchableOpacity activeOpacity={0.75} onPress={fechar}>
                <Text style={[styles.filterSheetClose, {color: theme.colors.primary}]}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.filterSheetContent}
            >
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, {color: theme.colors.onBackground}]}>
                  Período
                </Text>
                <View style={styles.adminDateRow}>
                  <DateField
                    label="De"
                    value={rascunho.dataInicial}
                    disabled={disabled}
                    onPress={() => setPicker('inicial')}
                  />
                  <DateField
                    label="Até"
                    value={rascunho.dataFinal}
                    disabled={disabled}
                    onPress={() => setPicker('final')}
                  />
                </View>
                <View style={styles.periodShortcuts}>
                  {ATALHOS.map(item => (
                    <TouchableOpacity
                      key={item.valor}
                      activeOpacity={0.75}
                      disabled={disabled}
                      onPress={() => selecionarAtalho(item.valor)}
                      style={styles.periodShortcut}
                    >
                      <Text style={[styles.periodShortcutText, {color: theme.colors.primary}]}>
                        {item.rotulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, {color: theme.colors.onBackground}]}>
                  Colaborador
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={disabled}
                  onPress={() => setCollaboratorsVisible(true)}
                  style={[
                    styles.collaboratorSelector,
                    {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.collaboratorSelectorValue, {color: theme.colors.onSurface}]}
                  >
                    {rascunho.busca || 'Todos os colaboradores'}
                  </Text>
                  <Text style={[styles.collaboratorSelectorAction, {color: theme.colors.primary}]}>
                    Selecionar
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionLabel, {color: theme.colors.onBackground}]}>
                  Resultado
                </Text>
                <View style={styles.filterResultOptions}>
                  {RESULTADOS.map(item => {
                    const selecionado = rascunho.resultado === item.valor;
                    return (
                      <TouchableOpacity
                        key={item.valor}
                        activeOpacity={0.8}
                        onPress={() => setRascunho(atual => ({
                          ...atual,
                          resultado: item.valor,
                        }))}
                        style={[
                          styles.filterResultOption,
                          {
                            backgroundColor: selecionado
                              ? theme.colors.primarySoft
                              : theme.colors.surface,
                            borderColor: selecionado
                              ? theme.colors.primary
                              : theme.colors.outline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterResultOptionText,
                            {color: selecionado ? theme.colors.primary : theme.colors.onSurface},
                          ]}
                        >
                          {item.rotulo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterSheetActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={disabled}
                onPress={limpar}
                style={[styles.clearFiltersButton, {borderColor: theme.colors.outline}]}
              >
                <Text style={[styles.clearFiltersText, {color: theme.colors.onSurface}]}>
                  Limpar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={disabled || !possuiAlteracoes}
                onPress={aplicar}
                style={[
                  styles.applyFiltersButton,
                  {backgroundColor: possuiAlteracoes
                    ? theme.colors.actionBackground
                    : theme.colors.surfaceVariant},
                ]}
              >
                <Text
                  style={[
                    styles.applyFiltersText,
                    {color: possuiAlteracoes
                      ? theme.colors.actionForeground
                      : theme.colors.onSurfaceVariant},
                  ]}
                >
                  Aplicar filtros
                </Text>
              </TouchableOpacity>
            </View>

            {picker && (
              <DateTimePicker
                value={picker === 'inicial'
                  ? rascunho.dataInicial
                  : rascunho.dataFinal}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                maximumDate={hoje}
                onChange={alterarData}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="slide"
        visible={visible && collaboratorsVisible}
        onRequestClose={() => setCollaboratorsVisible(false)}
      >
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar aos filtros"
            onPress={() => setCollaboratorsVisible(false)}
            style={styles.backdrop}
          />
          <View
            style={[
              styles.filterSheet,
              styles.collaboratorSheet,
              {
                backgroundColor: theme.colors.background,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={[styles.sheetHandle, {backgroundColor: theme.colors.outline}]} />
            <View style={styles.filterSheetHeader}>
              <Text style={[styles.filterSheetTitle, {color: theme.colors.onBackground}]}>
                Selecionar colaborador
              </Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setCollaboratorsVisible(false)}
              >
                <Text style={[styles.filterSheetClose, {color: theme.colors.primary}]}>
                  Voltar
                </Text>
              </TouchableOpacity>
            </View>
            <AdminCollaboratorSelector
              selected={rascunho.busca}
              onSelect={username => {
                setRascunho(atual => ({...atual, busca: username}));
                setCollaboratorsVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
