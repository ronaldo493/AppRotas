import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeDeviceSessionInvalidation,
  shouldInvalidateLocalSession,
} from '../src/core/auth/deviceSession/domain/deviceSessionPolicy';

test('revogação, expiração e sessão inválida encerram o acesso local', () => {
  assert.equal(
    shouldInvalidateLocalSession('SESSION_REVOKED_BY_NEW_LOGIN'),
    true,
  );
  assert.equal(shouldInvalidateLocalSession('DEVICE_SESSION_INVALID'), true);
  assert.equal(shouldInvalidateLocalSession('DEVICE_SESSION_EXPIRED'), true);
});

test('ausência temporária de sessão não derruba a restauração offline', () => {
  assert.equal(shouldInvalidateLocalSession('DEVICE_SESSION_REQUIRED'), false);
  assert.equal(shouldInvalidateLocalSession(undefined), false);
});

test('explica corretamente expiração, troca de aparelho e revogação administrativa', () => {
  assert.match(
    describeDeviceSessionInvalidation('expiracao').description,
    /novamente/,
  );
  assert.match(
    describeDeviceSessionInvalidation('novo_dispositivo').description,
    /outro aparelho/,
  );
  assert.match(
    describeDeviceSessionInvalidation('administrador').description,
    /administrador/,
  );
  assert.match(
    describeDeviceSessionInvalidation('renovacao_mesmo_dispositivo').description,
    /neste aparelho/,
  );
});
