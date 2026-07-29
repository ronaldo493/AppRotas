import axios from 'axios';
import {useCallback, useState} from 'react';
import {type AuthUser, useAuthContext} from '../../../core/auth/AuthContext';
import useStrapiClient from '../../../core/api/strapiClient';
import useLocation from '../../../core/location/useLocation';
import useAuthMenus from '../../menus/hooks/useAuthMenus';

interface LoginResponse {
  jwt: string;
  user: AuthUser;
}

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  conexaoLogin: (codigoUsuario: string, senha: string) => Promise<boolean>;
}

export default function useAuth():
  UseAuthReturn {
  const conexao = useStrapiClient();
  const {resolveCurrentCity} = useLocation();

  const {
    user,
    token,
    setUser,
    setToken,
    clearToken,
  } = useAuthContext();

  const { loadUserWithMenus } = useAuthMenus();

  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Registra o acesso do usuário no Strapi.
   *
   * Recebemos o usuário diretamente para não
   * depender da leitura do AsyncStorage.
   */
  const monitorarSessao = useCallback(
    async (
      userData: AuthUser,
      jwt: string,
    ): Promise<void> => {
      if (!userData.username) {
        console.warn(
          'Usuário sem username. Monitoramento não realizado.',
        );

        return;
      }

      try {
        const cidadeOrigem = await resolveCurrentCity();

        await conexao.post(
          '/sessoes',
          {
            data: {
              user: userData.username,
              setor: userData.setor ?? null,
              cidadeOrigem,
            },
          },
          {
            /*
             * Envia explicitamente o JWT porque
             * o estado do contexto pode ainda não
             * ter sido refletido no StrapiClient.
             */
            headers: {
              Authorization:
                `Bearer ${jwt}`,
            },
          },
        );
      } catch (requestError: unknown) {
        console.error(
          'Erro ao monitorar sessão:',
          axios.isAxiosError(requestError)
            ? requestError.response?.data
            : requestError,
        );

        /*
         * Falhar no monitoramento não deve
         * impedir o login.
         */
      }
    },
    [conexao, resolveCurrentCity],
  );

  const conexaoLogin = useCallback(
    async (
      codigoUsuario: string,
      senha: string,
    ): Promise<boolean> => {
      const identifier = codigoUsuario.trim();

      if (!identifier || !senha) {
        setError(
          'Informe o usuário e a senha.',
        );

        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await conexao.post<LoginResponse>(
            '/auth/local',
            {
              identifier,
              password: senha,
            },
          );

        const {
          jwt,
          user: loginUser,
        } = response.data;

        if (
          typeof jwt !== 'string' ||
          !jwt ||
          !loginUser
        ) {
          throw new Error(
            'O servidor não retornou os dados de autenticação.',
          );
        }

        /*
         * Busca os menus antes de concluir
         * a autenticação no aplicativo.
         */
        const userWithMenus =
          await loadUserWithMenus(
            jwt,
            loginUser,
          );

        /*
         * O AuthContext valida o campo exp
         * do JWT antes de armazená-lo.
         */
        await setToken(jwt);
        await setUser(userWithMenus);

        /*
         * Não bloqueia a entrada no aplicativo.
         */
        void monitorarSessao(
          userWithMenus,
          jwt,
        );

        return true;
      } catch (requestError: unknown) {
        console.error(
          'Erro ao realizar login:',
          axios.isAxiosError(requestError)
            ? requestError.response?.data
            : requestError,
        );

        /*
         * Evita deixar uma sessão incompleta
         * caso o token ou usuário já tenha sido
         * salvo antes de algum erro.
         */
        await clearToken();

        if (
          axios.isAxiosError(
            requestError,
          )
        ) {
          const status =
            requestError.response?.status;

          if (status === 400 || status === 401) {
            setError(
              'Usuário ou senha incorretos.',
            );

            return false;
          }
        }

        setError('Não foi possível realizar o login. Verifique sua conexão e tente novamente.');

        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      clearToken,
      conexao,
      loadUserWithMenus,
      monitorarSessao,
      setToken,
      setUser,
    ],
  );

  return {
    conexaoLogin,
    user,
    token,
    loading,
    error,
  };
}
