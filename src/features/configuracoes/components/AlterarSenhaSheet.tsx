import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './alterarSenhaSheet.styles';

export interface SenhaInput {
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

interface AlterarSenhaSheetProps {
  visible: boolean;
  loading: boolean;
  dismissible?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  onDismiss: () => void;
  onSubmit: (input: SenhaInput) => Promise<boolean>;
}

export default function AlterarSenhaSheet({
  visible,
  loading,
  dismissible = true,
  title = 'Alterar senha',
  description = 'Informe sua senha atual e escolha uma nova senha.',
  submitLabel = 'Salvar senha',
  onDismiss,
  onSubmit,
}: AlterarSenhaSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (visible) return;

    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setShowPasswords(false);
  }, [visible]);

  const handleDismiss = (): void => {
    if (dismissible && !loading) onDismiss();
  };

  const handleSubmit = async (): Promise<void> => {
    const updated = await onSubmit({
      currentPassword,
      newPassword,
      passwordConfirmation,
    });

    if (updated && dismissible) onDismiss();
  };

  const passwordIcon = () => (
    <TextInput.Icon
      icon={showPasswords ? 'eye-off' : 'eye'}
      accessibilityLabel={showPasswords ? 'Ocultar senhas' : 'Exibir senhas'}
      onPress={() => setShowPasswords(current => !current)}
    />
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={[styles.backdrop, {backgroundColor: theme.colors.backdrop}]}
          onPress={handleDismiss}
        >
          <Pressable
            style={[styles.sheet, {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 18),
            }]}
            onPress={event => event.stopPropagation()}
          >
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.handle, {backgroundColor: theme.colors.outline}]} />
              <Text style={[styles.title, {color: theme.colors.onSurface}]}>{title}</Text>
              <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>{description}</Text>

              <View style={styles.fields}>
                <TextInput
                  mode="outlined"
                  label="Senha atual"
                  value={currentPassword}
                  disabled={loading}
                  secureTextEntry={!showPasswords}
                  autoCapitalize="none"
                  autoCorrect={false}
                  right={passwordIcon()}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  mode="outlined"
                  label="Nova senha"
                  value={newPassword}
                  disabled={loading}
                  secureTextEntry={!showPasswords}
                  autoCapitalize="none"
                  autoCorrect={false}
                  right={passwordIcon()}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  mode="outlined"
                  label="Confirmar nova senha"
                  value={passwordConfirmation}
                  disabled={loading}
                  secureTextEntry={!showPasswords}
                  autoCapitalize="none"
                  autoCorrect={false}
                  right={passwordIcon()}
                  onChangeText={setPasswordConfirmation}
                />
              </View>

              <View style={styles.actions}>
                {dismissible ? (
                  <Button disabled={loading} textColor={theme.colors.onSurfaceVariant} onPress={handleDismiss}>Cancelar</Button>
                ) : null}
                <Button
                  mode="contained"
                  loading={loading}
                  disabled={loading}
                  buttonColor={theme.colors.actionBackground}
                  textColor={theme.colors.actionForeground}
                  contentStyle={styles.buttonContent}
                  style={styles.primaryButton}
                  onPress={() => void handleSubmit()}
                >
                  {submitLabel}
                </Button>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
