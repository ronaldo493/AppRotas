import React from 'react';
import {
  Button,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppTheme} from '../../core/theme/appTheme';
import type {Equipamento} from './models';
import styles from './preventiva.styles';

interface EquipmentModalProps {
  visible: boolean;
  mode: 'item' | 'machine';
  items: Equipamento[];
  newMachineLetter: string;
  onClose: () => void;
  onSelectItem: (item: Equipamento) => void;
  onAddMachine: () => void;
  onMachineLetterChange: (
    value: string,
  ) => void;
}

export default function EquipmentModal({
  visible,
  mode,
  items,
  newMachineLetter,
  onClose,
  onSelectItem,
  onAddMachine,
  onMachineLetterChange,
}: EquipmentModalProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor:
                theme.colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              {color: theme.colors.onSurface},
            ]}
          >
            {mode === 'item'
              ? 'Escolha um item'
              : 'Adicionar nova máquina'}
          </Text>

          {mode === 'item' ? (
            items.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.modalOption,
                  {
                    borderBottomColor:
                      theme.colors.outline,
                  },
                ]}
                onPress={() => {
                  onSelectItem(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        theme.colors.onSurface,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <>
              <TextInput
                value={newMachineLetter}
                maxLength={1}
                autoCapitalize="characters"
                placeholder="Letra da máquina"
                placeholderTextColor={
                  theme.colors
                    .onSurfaceVariant
                }
                onChangeText={
                  onMachineLetterChange
                }
                style={[
                  styles.input,
                  {
                    color:
                      theme.colors.onSurface,
                    borderColor:
                      theme.colors.outline,
                  },
                ]}
              />

              <Button
                title="Adicionar máquina"
                color={theme.colors.primary}
                onPress={onAddMachine}
              />
            </>
          )}

          <View style={styles.actionSpacing}>
            <Button
              title="Cancelar"
              color={theme.colors.primary}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
