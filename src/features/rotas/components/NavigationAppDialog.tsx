import React from 'react';
import {Text} from 'react-native';
import {
  Button,
  Dialog,
  Portal,
} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {NavegadorRota} from '../../execucaoRota/models/ExecucaoRota';

interface NavigationAppDialogProps {
  visible: boolean;
  processing: boolean;
  monitoringEnabled: boolean;
  onDismiss: () => void;
  onSelect: (navigator: NavegadorRota) => void;
}

/**
 * Mantém a escolha de navegador igual em todos os pontos de entrada da rota.
 * O texto operacional muda conforme o registro do percurso estiver ativo.
 */
export default function NavigationAppDialog({
  visible,
  processing,
  monitoringEnabled,
  onDismiss,
  onSelect,
}: NavigationAppDialogProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        dismissable={!processing}
        onDismiss={onDismiss}
        style={{
          backgroundColor: theme.colors.surface,
        }}
      >
        <Dialog.Title>
          Escolha o navegador
        </Dialog.Title>

        <Dialog.Content>
          <Text
            style={{
              color:
                theme.colors.onSurfaceVariant,
            }}
          >
            {monitoringEnabled
              ? 'O percurso será registrado após a escolha do navegador.'
              : 'A rota será aberta no navegador escolhido.'}
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            disabled={processing}
            onPress={onDismiss}
          >
            Cancelar
          </Button>

          <Button
            disabled={processing}
            onPress={() => onSelect('waze')}
          >
            Waze
          </Button>

          <Button
            disabled={processing}
            onPress={() => onSelect('google')}
          >
            Google Maps
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
