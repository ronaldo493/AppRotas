import {MaterialIcons} from '@expo/vector-icons';
import React, {useEffect, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View, type ListRenderItemInfo} from 'react-native';
import {Button, Divider, Modal, Portal, RadioButton} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './departamentoFilterSheet.styles';

export interface DepartamentoFiltro {
  key: string;
  label: string;
}

interface DepartamentoFilterSheetProps {
  visible: boolean;
  departamentos: DepartamentoFiltro[];
  value: string;
  onApply: (departamento: string) => void;
  onDismiss: () => void;
}

export default function DepartamentoFilterSheet({
  visible,
  departamentos,
  value,
  onApply,
  onDismiss,
}: DepartamentoFilterSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    if (visible) setSelectedValue(value);
  }, [value, visible]);

  const renderDepartamento = ({item}: ListRenderItemInfo<DepartamentoFiltro>): React.JSX.Element => {
    const selected = item.key === selectedValue;

    return (
      <TouchableOpacity
        accessibilityRole="radio"
        accessibilityState={{selected}}
        activeOpacity={0.7}
        style={[styles.option, selected && {backgroundColor: theme.colors.primarySoft}]}
        onPress={() => setSelectedValue(item.key)}
      >
        <Text style={[styles.optionText, {color: selected ? theme.colors.primary : theme.colors.onSurface}]}>
          {item.label}
        </Text>
        <RadioButton.Android value={item.key} status={selected ? 'checked' : 'unchecked'} color={theme.colors.primary} onPress={() => setSelectedValue(item.key)} />
      </TouchableOpacity>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} style={styles.modal} contentContainerStyle={[styles.sheet, {backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 16)}]}>
        <View style={[styles.handle, {backgroundColor: theme.colors.outline}]} />

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, {color: theme.colors.onSurface}]}>Filtrar contatos</Text>
            <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>Selecione um departamento</Text>
          </View>

          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar filtros" style={[styles.closeButton, {backgroundColor: theme.colors.buttonBackground}]} onPress={onDismiss}>
            <MaterialIcons name="close" size={20} color={theme.colors.iconDefault} />
          </TouchableOpacity>
        </View>

        <Divider />

        <FlatList
          data={departamentos}
          renderItem={renderDepartamento}
          keyExtractor={item => item.key || 'todos'}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.actions}>
          <Button mode="outlined" style={styles.actionButton} textColor={theme.colors.onSurface} onPress={() => onApply('')}>
            Limpar
          </Button>
          <Button mode="contained" style={styles.actionButton} buttonColor={theme.colors.primary} onPress={() => onApply(selectedValue)}>
            Aplicar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
