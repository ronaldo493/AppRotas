import {MaterialIcons} from '@expo/vector-icons';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';
import React, {useRef, useState} from 'react';
import {
  Alert,
  Button,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';

import {useAppTheme} from '../../core/theme/appTheme';
import type {Equipamento} from './models';
import styles from './preventiva.styles';

interface EquipmentItemProps {
  item: Equipamento;
  onUpdate: (
    label: string,
    value: string,
    option?: string | null,
  ) => void;
}

export default function EquipmentItem({
  item,
  onUpdate,
}: EquipmentItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const [permission, requestPermission] =
    useCameraPermissions();
  const [selectedValue, setSelectedValue] =
    useState<string | null>(
      item.options?.[0]?.value ?? null,
    );
  const [scannerVisible, setScannerVisible] =
    useState(false);
  const [patrimonio, setPatrimonio] =
    useState('');
  const scanLockRef = useRef(false);

  const openScanner =
    async (): Promise<void> => {
      let isGranted =
        permission?.granted ?? false;

      if (
        !isGranted &&
        permission?.canAskAgain !== false
      ) {
        const result =
          await requestPermission();

        isGranted = result.granted;
      }

      if (!isGranted) {
        Alert.alert(
          'Permissão necessária',
          'Autorize o uso da câmera nas configurações para ler o patrimônio.',
        );
        return;
      }

      scanLockRef.current = false;
      setScannerVisible(true);
    };

  const updatePatrimonio = (
    value: string,
  ): void => {
    const sanitized = value
      .replace(/\D/g, '')
      .slice(0, 6);

    setPatrimonio(sanitized);
    onUpdate(
      item.label,
      sanitized,
      selectedValue,
    );
  };

  const handleScan = ({
    data,
  }: BarcodeScanningResult): void => {
    if (scanLockRef.current) return;

    const sanitized = data
      .replace(/\D/g, '')
      .slice(0, 6);

    if (
      sanitized.length === 0 ||
      data.length > 6
    ) {
      Alert.alert(
        'Código inválido',
        'O código deve conter no máximo seis dígitos.',
      );
      return;
    }

    scanLockRef.current = true;
    setPatrimonio(sanitized);
    setScannerVisible(false);
    onUpdate(
      item.label,
      sanitized,
      selectedValue,
    );
  };

  return (
    <View>
      <View style={styles.equipmentRow}>
        <Text
          style={[
            styles.equipmentLabel,
            {color: theme.colors.onSurface},
          ]}
        >
          {item.label}
        </Text>

        <TextInput
          value={patrimonio}
          onChangeText={updatePatrimonio}
          placeholder="PATRIMÔNIO"
          placeholderTextColor={
            theme.colors.onSurfaceVariant
          }
          keyboardType="numeric"
          style={[
            styles.patrimonioInput,
            {
              color: theme.colors.onSurface,
              borderColor:
                theme.colors.outline,
              backgroundColor:
                theme.colors.surfaceVariant,
            },
          ]}
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Escanear ${item.label}`}
          style={[
            styles.scanButton,
            {
              backgroundColor:
                theme.colors.primary,
            },
          ]}
          onPress={() => {
            void openScanner();
          }}
        >
          <MaterialIcons
            name="qr-code-scanner"
            size={19}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </View>

      {item.requiresSelection && (
        <View style={styles.picker}>
          <Picker
            selectedValue={selectedValue}
            dropdownIconColor={
              theme.colors.onSurface
            }
            style={{
              color: theme.colors.onSurface,
              backgroundColor:
                theme.colors.surfaceVariant,
            }}
            onValueChange={value => {
              const normalized =
                typeof value === 'string'
                  ? value
                  : null;

              setSelectedValue(normalized);
              onUpdate(
                item.label,
                patrimonio,
                normalized,
              );
            }}
          >
            {item.options?.map(option => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      )}

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() =>
          setScannerVisible(false)
        }
      >
        <CameraView
          facing="back"
          style={styles.camera}
          onBarcodeScanned={handleScan}
        >
          <View style={styles.cameraActions}>
            <Button
              title="Cancelar"
              color={theme.colors.primary}
              onPress={() =>
                setScannerVisible(false)
              }
            />
          </View>
        </CameraView>
      </Modal>
    </View>
  );
}
