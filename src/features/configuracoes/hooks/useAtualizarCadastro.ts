import axios from 'axios';
import {useCallback, useState} from 'react';
import Toast from 'react-native-toast-message';

import {useAuthContext, type AuthUser} from '../../../core/auth/AuthContext';
import useStrapiClient from '../../../core/api/strapiClient';

interface AtualizarCadastroInput {
  emailSec: string;
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

interface WrappedUserResponse {
  data: AuthUser;
}

interface UseAtualizarCadastroReturn {
  loading: boolean;
  atualizarCadastro: (input: AtualizarCadastroInput) => Promise<boolean>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) return 'Não foi possível atualizar o cadastro.';

  const data = error.response?.data as {
    error?: {message?: string};
    message?: string;
  } | undefined;

  return data?.error?.message ?? data?.message ?? 'Não foi possível atualizar o cadastro.';
};

const getUpdatedUser = (response: unknown): AuthUser => {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as {data?: unknown}).data;

    if (data && typeof data === 'object') return data as AuthUser;
  }

  return response as AuthUser;
};

export default function useAtualizarCadastro(): UseAtualizarCadastroReturn {
  const client = useStrapiClient();
  const {user, setUser} = useAuthContext();
  const [loading, setLoading] = useState(false);

  const atualizarCadastro = useCallback(async (input: AtualizarCadastroInput): Promise<boolean> => {
    if (!user?.id) {
      Toast.show({type: 'error', text1: 'Usuário não identificado', text2: 'Entre novamente para atualizar o cadastro.'});
      return false;
    }

    const emailSec = input.emailSec.trim().toLowerCase();
    const currentEmailSec = user.emailSec?.trim().toLowerCase() ?? '';
    const emailChanged = emailSec !== currentEmailSec;
    const passwordFields = [
      input.currentPassword,
      input.newPassword,
      input.passwordConfirmation,
    ];
    const wantsPasswordChange = passwordFields.some(Boolean);

    if (!emailChanged && !wantsPasswordChange) {
      Toast.show({type: 'info', text1: 'Nenhuma alteração', text2: 'Informe uma nova senha.'});
      return false;
    }

    if (emailSec && !EMAIL_PATTERN.test(emailSec)) {
      Toast.show({type: 'error', text1: 'E-mail inválido', text2: 'Informe um endereço de e-mail válido.'});
      return false;
    }

    if (wantsPasswordChange && passwordFields.some(value => !value)) {
      Toast.show({type: 'error', text1: 'Preencha as senhas', text2: 'Informe a senha atual, a nova senha e a confirmação.'});
      return false;
    }

    if (wantsPasswordChange && input.newPassword.length < 8) {
      Toast.show({type: 'error', text1: 'Senha muito curta', text2: 'A nova senha deve possuir pelo menos 8 caracteres.'});
      return false;
    }

    if (wantsPasswordChange && input.newPassword !== input.passwordConfirmation) {
      Toast.show({type: 'error', text1: 'Senhas diferentes', text2: 'A confirmação deve ser igual à nova senha.'});
      return false;
    }

    if (wantsPasswordChange && input.currentPassword === input.newPassword) {
      Toast.show({type: 'error', text1: 'Escolha outra senha', text2: 'A nova senha deve ser diferente da senha atual.'});
      return false;
    }

    setLoading(true);
    let updatedUser = user;
    let emailUpdated = false;

    try {
      if (emailChanged) {
        const response = await client.put<AuthUser | WrappedUserResponse>(
          '/perfil/email',
          {emailSec: emailSec || null},
        );
        const responseUser = getUpdatedUser(response.data);

        updatedUser = {
          ...updatedUser,
          ...responseUser,
          emailSec: emailSec || null,
          menus: user.menus,
        };
        await setUser(updatedUser);
        emailUpdated = true;

      }

      if (wantsPasswordChange) {
        await client.post('/perfil/senha', {
          currentPassword: input.currentPassword,
          password: input.newPassword,
          passwordConfirmation: input.passwordConfirmation,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Cadastro atualizado',
        text2: emailChanged && wantsPasswordChange
          ? 'E-mail e senha atualizados.'
          : wantsPasswordChange
            ? 'Senha alterada com sucesso.'
            : 'E-mail Drogal atualizado.',
      });
      return true;
    } catch (error: unknown) {
      Toast.show({
        type: 'error',
        text1: emailUpdated ? 'E-mail atualizado, senha não alterada' : 'Não foi possível atualizar',
        text2: getErrorMessage(error),
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, setUser, user]);

  return {loading, atualizarCadastro};
}
