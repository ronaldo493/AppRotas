import React from 'react';

import useCheckVersion from '../hooks/useCheckVersion';
import AppUpdateModal from './AppUpdateModal';

/**
 * Bloqueia a interface quando o Strapi informa uma versão superior. O modal
 * só deixa de existir quando a versão instalada já atende à versão publicada.
 */
export default function AppVersionChecker(): React.JSX.Element | null {
  const {
    availableUpdate,
    currentVersion,
    loading,
    error,
    checkVersion,
  } = useCheckVersion();

  if (!availableUpdate) return null;

  return (
    <AppUpdateModal
      currentVersion={currentVersion}
      update={availableUpdate}
      checking={loading}
      verificationError={error}
      onRetry={() => {
        void checkVersion();
      }}
    />
  );
}
