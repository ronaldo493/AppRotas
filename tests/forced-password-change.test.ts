import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateForcedPasswordChange,
} from '../src/core/auth/forcedPasswordChange/domain/forcedPasswordChangeValidation';

const validInput = {
  currentPassword: '27Drogal',
  newPassword: 'NovaSenhaSegura9',
  passwordConfirmation: 'NovaSenhaSegura9',
};

test('aceita uma nova senha valida', () => {
  assert.equal(
    validateForcedPasswordChange(validInput),
    null,
  );
});

test('rejeita a senha temporaria como senha definitiva', () => {
  assert.notEqual(
    validateForcedPasswordChange({
      ...validInput,
      newPassword: '27Drogal',
      passwordConfirmation: '27Drogal',
    }),
    null,
  );
});

test('rejeita dados incompletos, senha curta e confirmacao diferente', () => {
  assert.notEqual(
    validateForcedPasswordChange({
      ...validInput,
      currentPassword: '',
    }),
    null,
  );
  assert.notEqual(
    validateForcedPasswordChange({
      ...validInput,
      newPassword: 'curta',
      passwordConfirmation: 'curta',
    }),
    null,
  );
  assert.notEqual(
    validateForcedPasswordChange({
      ...validInput,
      passwordConfirmation: 'OutraSenha9',
    }),
    null,
  );
});
