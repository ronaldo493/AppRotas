import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './patrimonioScannerModal.styles';

interface PatrimonioScannerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onRead: (patrimonio: string) => void;
}

/**
 * Mantém uma única instância da câmera para todo o formulário e solicita a
 * permissão apenas quando o usuário inicia uma leitura.
 */
export default function PatrimonioScannerModal({
  visible,
  onDismiss,
  onRead,
}: PatrimonioScannerModalProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [authorized, setAuthorized] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const requestInProgressRef = useRef(false);
  const scanLockRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      requestInProgressRef.current = false;
      scanLockRef.current = false;
      setAuthorized(false);
      setScannerError(null);
      return;
    }

    if (permission?.granted) {
      setAuthorized(true);
      return;
    }

    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    let cancelled = false;

    void requestPermission().then(result => {
      requestInProgressRef.current = false;
      if (cancelled) return;

      if (result.granted) {
        setAuthorized(true);
        return;
      }

      onDismiss();
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera para ler a etiqueta de patrimônio.',
        [
          {text: 'Cancelar', style: 'cancel'},
          {text: 'Abrir configurações', onPress: () => void Linking.openSettings()},
        ],
      );
    });

    return () => {
      cancelled = true;
    };
  }, [onDismiss, permission?.granted, requestPermission, visible]);

  const handleScan = ({data}: BarcodeScanningResult): void => {
    if (scanLockRef.current) return;

    const digits = data.replace(/\D/g, '');
    if (digits.length === 0 || digits.length > 6) {
      scanLockRef.current = true;
      setScannerError('O código lido deve conter até seis dígitos.');
      return;
    }

    scanLockRef.current = true;
    onRead(digits);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {authorized ? (
        <CameraView facing="back" style={styles.camera} onBarcodeScanned={handleScan}>
          <View style={[styles.header, {paddingTop: insets.top + 8}]}>
            <Text style={styles.title}>Ler patrimônio</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.closeButton}
              onPress={onDismiss}
            >
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.guide} />
          </View>

          <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 24)}]}>
            {scannerError ? (
              <>
                <Text style={styles.error}>{scannerError}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.action}
                    onPress={() => {
                      scanLockRef.current = false;
                      setScannerError(null);
                    }}
                  >
                    <Text style={styles.actionText}>Tentar novamente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.action}
                    onPress={onDismiss}
                  >
                    <Text style={styles.actionText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.hint}>Centralize a etiqueta dentro da área</Text>
            )}
          </View>
        </CameraView>
      ) : (
        <View style={[styles.loading, {backgroundColor: theme.colors.background}]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, {color: theme.colors.onBackground}]}>
            Preparando a câmera...
          </Text>
        </View>
      )}
    </Modal>
  );
}
