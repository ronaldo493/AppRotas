import axios, {type AxiosInstance} from 'axios';

import type {
  ForcedPasswordChangeInput,
} from '../domain/forcedPasswordChangeValidation';

interface ForcedPasswordChangeResponse {
  data?: {
    deveAlterarSenha?: unknown;
  };
}

/** Consulta no servidor a regra atual de primeiro acesso. */
export async function fetchPasswordChangeRequirement(
  client: AxiosInstance,
): Promise<boolean> {
  const response =
    await client.get<ForcedPasswordChangeResponse>(
      '/troca-senha-obrigatoria/status',
    );
  const required =
    response.data.data?.deveAlterarSenha;

  if (typeof required !== 'boolean') {
    throw new Error(
      'O servidor não retornou a verificação de primeiro acesso.',
    );
  }

  return required;
}

/** Troca a senha temporaria no endpoint isolado do primeiro acesso. */
export async function changeRequiredPassword(
  client: AxiosInstance,
  input: ForcedPasswordChangeInput,
): Promise<void> {
  const response =
    await client.post<ForcedPasswordChangeResponse>(
      '/troca-senha-obrigatoria',
      {
        currentPassword: input.currentPassword,
        password: input.newPassword,
        passwordConfirmation:
          input.passwordConfirmation,
      },
    );

  if (
    response.data.data?.deveAlterarSenha !== false
  ) {
    throw new Error(
      'O servidor não confirmou a alteração da senha.',
    );
  }
}

/** Converte erros do Axios em uma mensagem segura para o colaborador. */
export function getForcedPasswordChangeError(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : 'Não foi possível concluir a verificação.';
  }

  const data = error.response?.data as {
    error?: {message?: string};
    message?: string;
  } | undefined;

  return (
    data?.error?.message ??
    data?.message ??
    'Não foi possível comunicar com o servidor.'
  );
}
