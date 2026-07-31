import React, {memo} from 'react';
import {Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {
  CampoPatrimonio,
  Equipamento,
} from '../models/Patrimonio';
import SelectField from './SelectField';
import styles from './equipmentItem.styles';

interface EquipmentItemProps {
  sectionTitle: string;
  item: Equipamento;
  field: CampoPatrimonio;
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

/**
 * Renderiza somente os campos do equipamento. Câmera e seletores são mantidos
 * uma única vez pela tela para evitar instâncias nativas duplicadas.
 */
function EquipmentItem({
  sectionTitle,
  item,
  field,
  onUpdateItem,
  onRequestModel,
  onRequestScan,
}: EquipmentItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const label = item.label.replace(/:$/, '');
  const selectedOption = field.option ?? item.options?.[0]?.value ?? null;
  const selectedOptionLabel =
    item.options?.find(option => option.value === selectedOption)?.label ?? null;

  const normalizedField: CampoPatrimonio = {
    patrimonio: field.patrimonio,
    option: selectedOption,
  };

  return (
    <View style={[styles.container, {borderBottomColor: theme.colors.outline}]}>
      <Text style={[styles.label, {color: theme.colors.onSurface}]}>{label}</Text>

      {item.requiresSelection ? (
        <View style={styles.modelField}>
          <SelectField
            label="Modelo"
            value={selectedOptionLabel}
            placeholder="Selecione o modelo"
            onPress={() => onRequestModel(sectionTitle, item, normalizedField)}
          />
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          dense
          label="Patrimônio"
          value={field.patrimonio}
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
          onChangeText={value =>
            onUpdateItem(sectionTitle, item.label, {
              patrimonio: value.replace(/\D/g, '').slice(0, 6),
              option: selectedOption,
            })
          }
        />

        <Button
          compact
          mode="outlined"
          textColor={theme.colors.primary}
          style={styles.scanButton}
          contentStyle={styles.scanButtonContent}
          labelStyle={styles.scanButtonLabel}
          onPress={() => onRequestScan(sectionTitle, item, normalizedField)}
        >
          Ler etiqueta
        </Button>
      </View>
    </View>
  );
}

export default memo(EquipmentItem);
