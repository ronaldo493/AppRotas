import {useEffect, useRef} from 'react';

import {useAuthContext} from '../../core/auth/AuthContext';

/**
 * Executa uma limpeza quando a identidade autenticada muda, incluindo logout.
 * O primeiro usuário restaurado não é tratado como troca.
 */
export default function useResetOnUserChange(onUserChange: () => void): void {
  const {user} = useAuthContext();
  const userKey =
    user?.documentId ??
    (user?.id !== undefined ? String(user.id) : user?.username ?? null);
  const previousUserKeyRef = useRef(userKey);

  useEffect(() => {
    if (previousUserKeyRef.current === userKey) return;

    previousUserKeyRef.current = userKey;
    onUserChange();
  }, [onUserChange, userKey]);
}
