import React, {useEffect, useRef, useState} from 'react';

import useCheckVersion from '../hooks/useCheckVersion';
import AppUpdateModal from './AppUpdateModal';

export default function AppVersionChecker(): React.JSX.Element | null {
  const {availableUpdate, currentVersion} = useCheckVersion();
  const promptedVersionRef = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!availableUpdate || promptedVersionRef.current === availableUpdate.versao) return;

    promptedVersionRef.current = availableUpdate.versao;
    setVisible(true);
  }, [availableUpdate]);

  if (!availableUpdate) return null;

  return (
    <AppUpdateModal
      visible={visible}
      currentVersion={currentVersion}
      update={availableUpdate}
      onDismiss={() => setVisible(false)}
    />
  );
}
