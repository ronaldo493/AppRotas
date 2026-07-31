import React from 'react';
import {Text} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import {useExecucaoRota} from '../ExecucaoRotaContext';
import styles from './localizacaoRotaGuard.styles';

const getGuardMessage = (
  reason:
    | 'servico_indisponivel'
    | 'localizacao_desativada'
    | 'primeiro_plano_negado'
    | 'segundo_plano_negado',
): string => {
  switch (reason) {
    case 'servico_indisponivel':
      return 'O registro do percurso em segundo plano não está disponível nesta instalação. Instale uma nova versão do aplicativo.';
    case 'localizacao_desativada':
      return 'Para continuar registrando e concluir o percurso, mantenha a localização do aparelho ativada.';
    case 'primeiro_plano_negado':
      return 'Para registrar e concluir o percurso, permita o acesso à localização nas configurações do aplicativo.';
    case 'segundo_plano_negado':
      return 'Para registrar o percurso enquanto Maps ou Waze estiver aberto, permita o acesso à localização o tempo todo.';
  }
};

/**
 * Impede a continuidade silenciosa de uma rota quando o Android deixa de
 * fornecer localização e orienta a correção sem descartar os dados coletados.
 */
export default function LocalizacaoRotaGuard(): React.JSX.Element | null {
  const theme = useAppTheme();
  const {
    execucaoAtiva,
    indisponibilidadeLocalizacao,
    verificandoLocalizacao,
    abrirConfiguracoesLocalizacao,
    verificarLocalizacao,
  } = useExecucaoRota();

  if (
    !indisponibilidadeLocalizacao
  ) {
    return null;
  }

  const canOpenSettings =
    indisponibilidadeLocalizacao.motivo !==
    'servico_indisponivel';

  return (
    <Portal>
      <Dialog
        visible
        dismissable={false}
        style={{
          backgroundColor: theme.colors.surface,
        }}
      >
        <Dialog.Title>
          Localização necessária
        </Dialog.Title>

        <Dialog.Content>
          <Text
            style={[
              styles.message,
              {
                color:
                  theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {getGuardMessage(
              indisponibilidadeLocalizacao.motivo,
            )}
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            loading={
              Boolean(execucaoAtiva) &&
              verificandoLocalizacao
            }
            disabled={verificandoLocalizacao}
            onPress={() =>
              void verificarLocalizacao()
            }
          >
            {execucaoAtiva
              ? 'Verificar novamente'
              : 'Entendi'}
          </Button>

          {canOpenSettings && (
            <Button
              mode="contained"
              disabled={verificandoLocalizacao}
              onPress={() =>
                void abrirConfiguracoesLocalizacao()
              }
            >
              Abrir configurações
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
