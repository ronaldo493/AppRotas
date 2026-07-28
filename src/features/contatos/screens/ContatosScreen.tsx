import React, {useCallback, useDeferredValue, useEffect, useMemo, useState} from 'react';
import {MaterialIcons} from '@expo/vector-icons';
import {ActivityIndicator, FlatList, Text, TouchableOpacity, View, type ListRenderItemInfo} from 'react-native';
import {Chip, Searchbar} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import ContatoCard from '../components/ContatoCard';
import DepartamentoFilterSheet, {type DepartamentoFiltro} from '../components/DepartamentoFilterSheet';
import useContatos from '../hooks/useContatos';
import type {Contato} from '../models/Contato';
import styles from './contatosScreen.styles';

const TODOS_DEPARTAMENTOS = '';

const normalizarTexto = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');

export default function ContatosScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {contatos, loading, error, recarregar} = useContatos();
  const [busca, setBusca] = useState('');
  const [departamento, setDepartamento] = useState(TODOS_DEPARTAMENTOS);
  const [filterVisible, setFilterVisible] = useState(false);
  const buscaAdiada = useDeferredValue(busca);

  const departamentos = useMemo(() => {
    const valores = new Map<string, string>();

    contatos.forEach(contato => {
      const label = contato.departamento.trim();
      const key = normalizarTexto(label);

      if (key && !valores.has(key)) valores.set(key, label);
    });

    const opcoes = Array.from(valores, ([key, label]) => ({key, label}))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    return [{key: TODOS_DEPARTAMENTOS, label: 'Todos'}, ...opcoes] satisfies DepartamentoFiltro[];
  }, [contatos]);

  useEffect(() => {
    if (departamento && !departamentos.some(item => item.key === departamento)) {
      setDepartamento(TODOS_DEPARTAMENTOS);
    }
  }, [departamento, departamentos]);

  const contatosFiltrados = useMemo(() => {
    const termo = normalizarTexto(buscaAdiada);

    return contatos.filter(contato => {
      const pertenceAoDepartamento =
        departamento === TODOS_DEPARTAMENTOS ||
        normalizarTexto(contato.departamento) === departamento;
      const conteudo = normalizarTexto([
        contato.departamento,
        contato.colaboradores,
        contato.ramal ?? '',
        contato.ddr ?? '',
        contato.email ?? '',
      ].join(' '));

      return pertenceAoDepartamento && (!termo || conteudo.includes(termo));
    });
  }, [buscaAdiada, contatos, departamento]);

  const renderContato = useCallback(
    ({item}: ListRenderItemInfo<Contato>): React.JSX.Element => <ContatoCard contato={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Contato): string =>
    item.documentId ?? String(item.id ?? `${item.departamento}-${item.colaboradores}-${item.ramal ?? ''}`),
  []);

  const quantidadeLabel = `${contatosFiltrados.length} ${contatosFiltrados.length === 1 ? 'contato encontrado' : 'contatos encontrados'}`;
  const departamentoSelecionado = departamentos.find(item => item.key === departamento);

  const applyDepartamento = (value: string): void => {
    setDepartamento(value);
    setFilterVisible(false);
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.searchRow}>
        <Searchbar
          value={busca}
          placeholder="Nome, departamento, ramal ou e-mail"
          accessibilityLabel="Buscar contatos"
          style={[styles.search, {backgroundColor: theme.colors.surface}]}
          inputStyle={[styles.searchInput, {color: theme.colors.onSurface}]}
          iconColor={theme.colors.iconDefault}
          onChangeText={setBusca}
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Filtrar por departamento"
          style={[styles.filterButton, {
            backgroundColor: departamento ? theme.colors.primary : theme.colors.surface,
            borderColor: departamento ? theme.colors.primary : theme.colors.outline,
          }]}
          onPress={() => setFilterVisible(true)}
        >
          <MaterialIcons name="tune" size={22} color={departamento ? theme.colors.onPrimary : theme.colors.iconDefault} />
          {departamento ? <View style={[styles.filterDot, {backgroundColor: theme.colors.onPrimary}]} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.resultHeader}>
        <Text style={[styles.resultCount, {color: theme.colors.onSurfaceVariant}]}>{quantidadeLabel}</Text>
        {departamento && departamentoSelecionado ? (
          <Chip compact icon="office-building" onClose={() => setDepartamento(TODOS_DEPARTAMENTOS)} style={{backgroundColor: theme.colors.primarySoft}} textStyle={[styles.activeFilterText, {color: theme.colors.primary}]}>
            {departamentoSelecionado.label}
          </Chip>
        ) : null}
      </View>

      <FlatList
        data={contatosFiltrados}
        renderItem={renderContato}
        keyExtractor={keyExtractor}
        refreshing={loading && contatos.length > 0}
        contentContainerStyle={[styles.listContent, contatosFiltrados.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        onRefresh={() => void recarregar()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.emptyDescription, {color: theme.colors.onSurfaceVariant}]}>Carregando contatos...</Text>
              </>
            ) : (
              <>
                <Text style={[styles.emptyTitle, {color: theme.colors.onBackground}]}>Nenhum contato encontrado</Text>
                <Text style={[styles.emptyDescription, {color: theme.colors.onSurfaceVariant}]}>
                  {error ?? 'Altere os filtros ou a busca para encontrar outro contato.'}
                </Text>
              </>
            )}
          </View>
        }
      />

      <DepartamentoFilterSheet
        visible={filterVisible}
        departamentos={departamentos}
        value={departamento}
        onApply={applyDepartamento}
        onDismiss={() => setFilterVisible(false)}
      />
    </View>
  );
}
