export interface ForcedPasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

export const DEFAULT_TEMPORARY_PASSWORD = '27Drogal';

/** Retorna a mensagem de validacao ou `null` quando os dados sao validos. */
export function validateForcedPasswordChange(
  input: ForcedPasswordChangeInput,
): string | null {
  if (
    !input.currentPassword ||
    !input.newPassword ||
    !input.passwordConfirmation
  ) {
    return 'Informe a senha atual, a nova senha e a confirmação.';
  }

  if (input.newPassword.length < 8) {
    return 'A nova senha deve possuir pelo menos 8 caracteres.';
  }

  if (input.newPassword.length > 128) {
    return 'A nova senha deve possuir no máximo 128 caracteres.';
  }

  if (input.newPassword !== input.passwordConfirmation) {
    return 'A confirmação deve ser igual à nova senha.';
  }

  if (input.currentPassword === input.newPassword) {
    return 'A nova senha deve ser diferente da senha atual.';
  }

  if (input.newPassword === DEFAULT_TEMPORARY_PASSWORD) {
    return 'Escolha uma senha diferente da senha temporária.';
  }

  return null;
}
