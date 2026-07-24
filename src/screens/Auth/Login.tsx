import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import useAuth from '../../hooks/useAuth';
import LoginStyles from './styles/LoginStyles';
import { useAppTheme } from '../../components/ThemeStyles';

export default function Login(): React.JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const { conexaoLogin, loading, error } = useAuth();
  const theme = useAppTheme();

  const handleUsernameChange = (text: string): void => {
    setUsername(text);
    setValidationError('');
  };

  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    setValidationError('');
  };

  const handleTogglePassword = (): void => {
    setShowPassword(current => !current);
  };

  const handleLogin = async (): Promise<void> => {
    const userCode: string = username.trim();

    if (!userCode || !password) {
      setValidationError('Preencha todos os campos.');
      return;
    }

    setValidationError('');

    const email: string = `${userCode}@drogal.com.br`;

    await conexaoLogin(email, password);
  };

  const displayedError: string =
    validationError || (typeof error === 'string' ? error : '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[LoginStyles.container,{ backgroundColor: theme.colors.background }]}
    >
      <View style={LoginStyles.content}>
        <View style={LoginStyles.headerLogin}>
          {/* <Image
            source={require('../../assets/img/drogal.png')}
            style={LoginStyles.logo}
            resizeMode="contain"
          /> */}

          <Text style={[LoginStyles.description,{ color: theme.colors.onSurfaceVariant }]}>
            Entre com seu código de usuário para continuar.
          </Text>
        </View>

        {displayedError && (
          <View
            style={[
              LoginStyles.errorContainer,
              {
                backgroundColor: theme.colors.errorContainer,
                borderColor: theme.colors.error,
              },
            ]}
          >
            <MaterialIcons
              name="error-outline"
              size={19}
              color={theme.colors.error}
            />

            <Text style={[LoginStyles.errorText,{ color: theme.colors.onErrorContainer }]}>
              {displayedError}
            </Text>
          </View>
        )}

        <View style={LoginStyles.form}>
          <View
            style={[
              LoginStyles.inputContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <MaterialIcons
              name="person-outline"
              size={22}
              color={theme.colors.iconDefault}
            />

            <TextInput
              style={[LoginStyles.input,{ color: theme.colors.onSurface }]}
              placeholder="Código do usuário"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View
            style={[
              LoginStyles.inputContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <MaterialIcons
              name="lock-outline"
              size={22}
              color={theme.colors.iconDefault}
            />

            <TextInput
              style={[LoginStyles.input,{ color: theme.colors.onSurface }]}
              placeholder="Senha"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={handlePasswordChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => void handleLogin()}
            />

            <TouchableOpacity
              onPress={handleTogglePassword}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? 'Ocultar senha' : 'Exibir senha'
              }
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={21}
                color={theme.colors.iconDefault}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => void handleLogin()}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            style={[
              LoginStyles.button,
              {
                backgroundColor: theme.colors.actionBackground,
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.actionForeground}
              />
            ) : (
              <Text
                style={[
                  LoginStyles.buttonText,
                  { color: theme.colors.actionForeground },
                ]}
              >
                Entrar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={LoginStyles.footerLogin}>
          <MaterialIcons
            name="info-outline"
            size={17}
            color={theme.colors.iconDefault}
          />

          <Text style={[LoginStyles.forgotText, { color: theme.colors.onSurfaceVariant }]}
          >
            Para trocar sua senha, entre em contato com o administrador.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}