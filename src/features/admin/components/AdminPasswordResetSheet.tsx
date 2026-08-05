import React from 'react';
import {Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';
import styles from '../styles/adminPasswordManagement.styles';

/** Confirma a operação sensível sem exibir ou transportar a senha temporária. */
export default function AdminPasswordResetSheet({
  usuario,
  loading,
  onClose,
  onConfirm,
}: {
  usuario: UsuarioAdministravel | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!usuario) return <></>;

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar redefinição de senha"
          disabled={loading}
          onPress={onClose}
          style={[styles.backdrop, {backgroundColor: theme.colors.backdrop}]}
        />
        <View
          style={[
            styles.resetSheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
        >
          <View style={[styles.sheetHandle, {backgroundColor: theme.colors.outline}]} />
          <Text style={[styles.sheetTitle, {color: theme.colors.onSurface}]}>
            Redefinir senha
          </Text>
          <Text style={[styles.sheetDescription, {color: theme.colors.onSurfaceVariant}]}>
            A senha de {usuario.username} voltará para o padrão temporário. No próximo acesso, o colaborador será obrigado a criar uma nova senha.
          </Text>
          {usuario.bloqueado && (
            <Text style={[styles.blockedNotice, {color: theme.colors.warning}]}>
              O usuário continuará bloqueado após a redefinição.
            </Text>
          )}
          <View style={styles.sheetActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={loading}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelButtonText, {color: theme.colors.onSurfaceVariant}]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={loading}
              onPress={onConfirm}
              style={[
                styles.confirmButton,
                {backgroundColor: theme.colors.actionBackground},
              ]}
            >
              <Text style={[styles.confirmButtonText, {color: theme.colors.actionForeground}]}>
                {loading ? 'Redefinindo...' : 'Redefinir senha'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
