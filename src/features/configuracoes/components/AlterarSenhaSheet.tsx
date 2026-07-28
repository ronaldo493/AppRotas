import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './alterarSenhaSheet.styles';

interface SenhaInput {
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

interface AlterarSenhaSheetProps {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onSubmit: (input: SenhaInput) => Promise<boolean>;
}

export default function AlterarSenhaSheet({
  visible,
  loading,
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
    if (!loading) onDismiss();
  };

  const handleSubmit = async (): Promise<void> => {
    const updated = await onSubmit({
      currentPassword,
      newPassword,
      passwordConfirmation,
    });

    if (updated) onDismiss();
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
              <Text style={[styles.title, {color: theme.colors.onSurface}]}>Alterar senha</Text>
              <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>Informe sua senha atual e escolha uma nova senha.</Text>

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
                <Button disabled={loading} textColor={theme.colors.onSurfaceVariant} onPress={handleDismiss}>Cancelar</Button>
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
                  Salvar senha
                </Button>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
