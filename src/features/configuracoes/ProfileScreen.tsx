import React, {useEffect, useMemo, useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';

import {useAuthContext} from '../../core/auth/AuthContext';
import {useAppTheme} from '../../core/theme/appTheme';
import AlterarSenhaSheet from '../../shared/components/AlterarSenhaSheet';
import useAtualizarCadastro from './hooks/useAtualizarCadastro';
import ProfileStyles from './profileScreen.styles';

export default function ProfileScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {user} = useAuthContext();
  const {loading, atualizarCadastro} = useAtualizarCadastro();
  const [emailSec, setEmailSec] = useState('');
  const [emailFormVisible, setEmailFormVisible] = useState(false);
  const [passwordSheetVisible, setPasswordSheetVisible] = useState(false);

  useEffect(() => {
    setEmailSec(user?.emailSec ?? '');
  }, [user?.emailSec]);

  const emailChanged = useMemo(
    () => emailSec.trim().toLowerCase() !== (user?.emailSec?.trim().toLowerCase() ?? ''),
    [emailSec, user?.emailSec],
  );

  const handleEmailUpdate = async (): Promise<void> => {
    const updated = await atualizarCadastro({
      emailSec,
      currentPassword: '',
      newPassword: '',
      passwordConfirmation: '',
    });

    if (updated) setEmailFormVisible(false);
  };

  const handlePasswordUpdate = async (input: {
    currentPassword: string;
    newPassword: string;
    passwordConfirmation: string;
  }): Promise<boolean> => atualizarCadastro({
    emailSec: user?.emailSec ?? '',
    ...input,
  });

  return (
    <KeyboardAvoidingView style={[ProfileStyles.container, {backgroundColor: theme.colors.background}]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ProfileStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[ProfileStyles.title, {color: theme.colors.onBackground}]}>Meu perfil</Text>
        <Text style={[ProfileStyles.description, {color: theme.colors.onSurfaceVariant}]}>Confira seus dados e mantenha seu e-mail atualizado.</Text>

        <View style={[ProfileStyles.infoCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline}]}>
          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.infoLabel, {color: theme.colors.onSurfaceVariant}]}>Usuário</Text>
            <Text selectable style={[ProfileStyles.infoValue, {color: theme.colors.onSurface}]}>{user?.username || 'Não disponível'}</Text>
          </View>
          <View style={[ProfileStyles.divider, {backgroundColor: theme.colors.outline}]} />
          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.infoLabel, {color: theme.colors.onSurfaceVariant}]}>Setor</Text>
            <Text selectable style={[ProfileStyles.infoValue, {color: theme.colors.onSurface}]}>{user?.setor || 'Não disponível'}</Text>
          </View>
          <View style={[ProfileStyles.divider, {backgroundColor: theme.colors.outline}]} />
          <View style={ProfileStyles.infoRow}>
            <Text style={[ProfileStyles.infoLabel, {color: theme.colors.onSurfaceVariant}]}>E-mail Drogal</Text>
            {user?.emailSec ? (
              <Text numberOfLines={1} selectable style={[ProfileStyles.infoValue, {color: theme.colors.onSurface}]}>{user.emailSec}</Text>
            ) : (
              <Button
                compact
                mode="text"
                disabled={loading}
                textColor={theme.colors.primary}
                style={ProfileStyles.addEmailButton}
                contentStyle={ProfileStyles.addEmailButtonContent}
                labelStyle={ProfileStyles.addEmailButtonLabel}
                onPress={() => setEmailFormVisible(true)}
              >
                Adicionar
              </Button>
            )}
          </View>
        </View>

        {emailFormVisible && !user?.emailSec ? (
          <View style={ProfileStyles.emailForm}>
            <TextInput
              mode="outlined"
              dense
              autoFocus
              label="E-mail Drogal"
              value={emailSec}
              disabled={loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setEmailSec}
            />
            <View style={ProfileStyles.emailActions}>
              <Button
                disabled={loading}
                textColor={theme.colors.onSurfaceVariant}
                onPress={() => {
                  setEmailSec('');
                  setEmailFormVisible(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                loading={loading && emailChanged}
                disabled={loading || !emailChanged}
                buttonColor={theme.colors.actionBackground}
                textColor={theme.colors.actionForeground}
                style={ProfileStyles.emailFormButton}
                onPress={() => void handleEmailUpdate()}
              >
                Salvar
              </Button>
            </View>
          </View>
        ) : null}

        <View style={[ProfileStyles.passwordSection, {borderTopColor: theme.colors.outline}]}>
          <Text style={[ProfileStyles.sectionTitle, {color: theme.colors.onSurface}]}>Senha</Text>
          <Text style={[ProfileStyles.passwordDescription, {color: theme.colors.onSurfaceVariant}]}>Altere sua senha de acesso quando necessário.</Text>
          <Button
            mode="contained"
            disabled={loading}
            buttonColor={theme.colors.actionBackground}
            textColor={theme.colors.actionForeground}
            contentStyle={ProfileStyles.buttonContent}
            style={ProfileStyles.button}
            onPress={() => setPasswordSheetVisible(true)}
          >
            Alterar senha
          </Button>
        </View>
      </ScrollView>

      <AlterarSenhaSheet
        visible={passwordSheetVisible}
        loading={loading}
        onDismiss={() => setPasswordSheetVisible(false)}
        onSubmit={handlePasswordUpdate}
      />
    </KeyboardAvoidingView>
  );
}
