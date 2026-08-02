import React from 'react';
import {Text} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './confirmacaoPermissaoRastreamentoDialog.styles';

interface ConfirmacaoPermissaoRastreamentoDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Explica a permissão de localização antes de o Android abrir a solicitação
 * nativa, que pode levar o usuário diretamente para as configurações.
 */
export default function ConfirmacaoPermissaoRastreamentoDialog({
  visible,
  onConfirm,
  onDismiss,
}: ConfirmacaoPermissaoRastreamentoDialogProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        dismissable
        onDismiss={onDismiss}
        style={{backgroundColor: theme.colors.surface}}
      >
        <Dialog.Title>Permissão de localização</Dialog.Title>

        <Dialog.Content>
          <Text
            style={[
              styles.message,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            Para registrar o percurso mesmo com Maps ou Waze aberto, permita a
            localização o tempo todo nas próximas etapas.
          </Text>

          <Text
            style={[
              styles.detail,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            Essa permissão é utilizada somente durante um percurso iniciado no
            aplicativo.
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Agora não</Button>
          <Button mode="contained" onPress={onConfirm}>
            Continuar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
