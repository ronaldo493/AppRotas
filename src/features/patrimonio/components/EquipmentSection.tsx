import React, {memo, useMemo} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Button} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {
  CampoPatrimonio,
  Equipamento,
  EquipamentoSelecionado,
} from '../models/Patrimonio';
import EquipmentItem from './EquipmentItem';
import styles from './equipmentSection.styles';

interface EquipmentSectionProps {
  title: string;
  items: Equipamento[];
  selectedItems: EquipamentoSelecionado[];
  fields: Record<string, CampoPatrimonio>;
  onAddItem: (sectionTitle: string) => void;
  onDelete: (sectionTitle: string) => void;
  onUpdateItem: (
    sectionTitle: string,
    itemName: string,
    field: CampoPatrimonio,
  ) => void;
  onRequestModel: (
    sectionTitle: string,
    item: Equipamento,
    field: CampoPatrimonio,
  ) => void;
  onRequestScan: (
    sectionTitle: string,
    item: Equipamento,
    field: CampoPatrimonio,
  ) => void;
}

const EMPTY_FIELD: CampoPatrimonio = {patrimonio: '', option: null};

/**
 * Agrupa os equipamentos de uma posição e encaminha as alterações ao estado
 * central do relatório.
 */
function EquipmentSection({
  title,
  items,
  selectedItems,
  fields,
  onAddItem,
  onDelete,
  onUpdateItem,
  onRequestModel,
  onRequestScan,
}: EquipmentSectionProps): React.JSX.Element {
  const theme = useAppTheme();
  const equipment = useMemo(
    () => [...items, ...selectedItems],
    [items, selectedItems],
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, {color: theme.colors.onSurface}]}>{title}</Text>
          <Text style={[styles.caption, {color: theme.colors.onSurfaceVariant}]}>
            {equipment.length} {equipment.length === 1 ? 'equipamento' : 'equipamentos'}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Excluir posição ${title}`}
          hitSlop={8}
          style={styles.deleteButton}
          onPress={() => onDelete(title)}
        >
          <Text style={[styles.deleteText, {color: theme.colors.primary}]}>Excluir</Text>
        </TouchableOpacity>
      </View>

      {equipment.map(item => (
        <EquipmentItem
          key={`${title}-${item.label}`}
          sectionTitle={title}
          item={item}
          field={fields[item.label] ?? EMPTY_FIELD}
          onUpdateItem={onUpdateItem}
          onRequestModel={onRequestModel}
          onRequestScan={onRequestScan}
        />
      ))}

      <Button
        compact
        mode="text"
        textColor={theme.colors.primary}
        style={styles.addButton}
        labelStyle={styles.addButtonLabel}
        onPress={() => onAddItem(title)}
      >
        Adicionar equipamento
      </Button>
    </View>
  );
}

export default memo(EquipmentSection);
