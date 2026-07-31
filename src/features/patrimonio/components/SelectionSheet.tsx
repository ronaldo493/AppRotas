import React from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import {Modal, Portal} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './selectionSheet.styles';

export interface SelectionOption {
  value: string;
  label: string;
}

interface SelectionSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  options: SelectionOption[];
  value?: string | null;
  onSelect: (value: string) => void;
  onDismiss: () => void;
}

/**
 * Seletor temático usado no lugar de componentes nativos que não respeitam o
 * modo escuro do aplicativo.
 */
export default function SelectionSheet({
  visible,
  title,
  description,
  options,
  value,
  onSelect,
  onDismiss,
}: SelectionSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const renderOption = ({item, index}: ListRenderItemInfo<SelectionOption>) => {
    const selected = item.value === value;

    return (
      <TouchableOpacity
        accessibilityRole="radio"
        accessibilityState={{selected}}
        activeOpacity={0.72}
        style={[
          styles.option,
          {
            backgroundColor: selected
              ? theme.colors.primarySoft
              : theme.colors.surface,
            borderBottomColor: theme.colors.outline,
            borderBottomWidth: index === options.length - 1 ? 0 : 1,
          },
        ]}
        onPress={() => onSelect(item.value)}
      >
        <Text
          style={[
            styles.optionText,
            {color: selected ? theme.colors.primary : theme.colors.onSurface},
          ]}
        >
          {item.label}
        </Text>

        {selected ? (
          <Text style={[styles.selectedText, {color: theme.colors.primary}]}>
            Selecionado
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={styles.modal}
        contentContainerStyle={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={[styles.handle, {backgroundColor: theme.colors.outline}]} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, {color: theme.colors.onSurface}]}>{title}</Text>
            {description ? (
              <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
                {description}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            hitSlop={8}
            style={styles.closeButton}
            onPress={onDismiss}
          >
            <Text style={[styles.closeText, {color: theme.colors.primary}]}>Fechar</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, {backgroundColor: theme.colors.outline}]} />

        <FlatList
          data={options}
          renderItem={renderOption}
          keyExtractor={item => item.value}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </Modal>
    </Portal>
  );
}
