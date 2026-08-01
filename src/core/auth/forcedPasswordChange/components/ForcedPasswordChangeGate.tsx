import React, {type PropsWithChildren, useState} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {Button} from 'react-native-paper';

import {useAppTheme} from '../../../theme/appTheme';
import AlterarSenhaSheet from '../../../../features/configuracoes/components/AlterarSenhaSheet';
import useForcedPasswordChange from '../hooks/useForcedPasswordChange';
import styles from './forcedPasswordChangeGate.styles';

/**
 * Impede a montagem da aplicacao autenticada enquanto a senha temporaria nao
 * for substituida. Remover este wrapper desativa todo o fluxo obrigatório.
 */
export default function ForcedPasswordChangeGate({
  children,
}: PropsWithChildren): React.JSX.Element {
  const theme = useAppTheme();
  const {
    authenticated,
    status,
    errorMessage,
    changingPassword,
    retry,
    logout,
    changePassword,
  } = useForcedPasswordChange();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!authenticated || status === 'allowed') {
    return <>{children}</>;
  }

  const handleLogout = async (): Promise<void> => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background},
      ]}
    >
      <StatusBar
        barStyle={
          theme.custom.isDarkMode
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={theme.colors.background}
      />

      <View style={styles.content}>
        {status === 'checking' ? (
          <>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />
            <Text style={[styles.title, {color: theme.colors.onBackground}]}>
              Verificando seu acesso
            </Text>
            <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
              Aguarde um instante para continuar.
            </Text>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <Text style={[styles.title, {color: theme.colors.onBackground}]}>
              Não foi possível verificar seu acesso
            </Text>
            <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
              {errorMessage ?? 'Verifique sua internet e tente novamente.'}
            </Text>
            <View style={styles.actions}>
              <Button
                mode="contained"
                disabled={loggingOut}
                buttonColor={theme.colors.actionBackground}
                textColor={theme.colors.actionForeground}
                contentStyle={styles.buttonContent}
                style={styles.button}
                onPress={retry}
              >
                Tentar novamente
              </Button>
              <Button
                mode="text"
                loading={loggingOut}
                disabled={loggingOut}
                textColor={theme.colors.primary}
                style={styles.button}
                onPress={() => void handleLogout()}
              >
                Sair
              </Button>
            </View>
          </>
        ) : null}

        {status === 'required' ? (
          <>
            <Text style={[styles.title, {color: theme.colors.onBackground}]}>
              Proteja sua conta
            </Text>
            <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
              Crie uma senha pessoal para acessar o aplicativo.
            </Text>
          </>
        ) : null}
      </View>

      <AlterarSenhaSheet
        visible={status === 'required'}
        loading={changingPassword}
        dismissible={false}
        title="Crie sua nova senha"
        description="Informe a senha temporária e escolha uma nova senha pessoal."
        submitLabel="Continuar"
        onDismiss={() => undefined}
        onSubmit={changePassword}
      />
    </View>
  );
}
