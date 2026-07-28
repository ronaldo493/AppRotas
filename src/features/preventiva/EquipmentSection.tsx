import {MaterialIcons} from '@expo/vector-icons';
import React from 'react';
import {
  Button,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppTheme} from '../../core/theme/appTheme';
import type {
  Equipamento,
  EquipamentoSelecionado,
} from './models';
import EquipmentItem from './EquipmentItem';
import styles from './preventiva.styles';

interface EquipmentSectionProps {
  title: string;
  items: Equipamento[];
  selectedItems: EquipamentoSelecionado[];
  onAddItem: () => void;
  onDelete: () => void;
  onUpdateItem: (
    label: string,
    value: string,
    option?: string | null,
  ) => void;
}

export default function EquipmentSection({
  title,
  items,
  selectedItems,
  onAddItem,
  onDelete,
  onUpdateItem,
}: EquipmentSectionProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor:
            theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {color: theme.colors.onSurface},
          ]}
        >
          {title}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Excluir seção ${title}`}
          onPress={onDelete}
        >
          <MaterialIcons
            name="delete-outline"
            size={24}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>

      {[...items, ...selectedItems].map(
        item => (
          <EquipmentItem
            key={`${title}-${item.label}`}
            item={item}
            onUpdate={onUpdateItem}
          />
        ),
      )}

      <Button
        title="Adicionar item"
        color={theme.colors.primary}
        onPress={onAddItem}
      />
    </View>
  );
}
