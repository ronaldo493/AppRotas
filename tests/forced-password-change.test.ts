import assert from 'node:assert/strict';
import test from 'node:test';
import type {AxiosInstance} from 'axios';

import {
  validateForcedPasswordChange,
} from '../src/core/auth/forcedPasswordChange/domain/forcedPasswordChangeValidation';
import {getCachedPasswordChangeStatus} from '../src/core/auth/forcedPasswordChange/domain/forcedPasswordChangeOfflinePolicy';
import {fetchPasswordChangeRequirement} from '../src/core/auth/forcedPasswordChange/services/forcedPasswordChangeService';

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

test('libera offline um perfil local que ja concluiu a troca', () => {
  assert.equal(
    getCachedPasswordChangeStatus(false),
    'allowed',
  );
});

test('mantem offline o bloqueio de uma senha temporaria', () => {
  assert.equal(
    getCachedPasswordChangeStatus(true),
    'required',
  );
});

test('nao libera perfil sem decisao local valida', () => {
  assert.equal(
    getCachedPasswordChangeStatus(undefined),
    null,
  );
  assert.equal(
    getCachedPasswordChangeStatus('false'),
    null,
  );
});

test('consulta remota de primeiro acesso nao repete durante indisponibilidade', async () => {
  let receivedConfig: unknown = null;
  const client = {
    get: async (_url: string, config: unknown) => {
      receivedConfig = config;

      return {
        data: {
          data: {deveAlterarSenha: false},
        },
      };
    },
  } as unknown as AxiosInstance;

  const required =
    await fetchPasswordChangeRequirement(client);

  assert.equal(required, false);
  assert.deepEqual(receivedConfig, {
    timeout: 5_000,
    'axios-retry': {retries: 0},
  });
});
