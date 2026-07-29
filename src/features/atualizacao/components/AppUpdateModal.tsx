import React, {useEffect, useMemo, useState} from 'react';
import {Platform, Text, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {AtualizacaoApp} from '../models/AtualizacaoApp';
import {abrirUrlAtualizacao, obterUrlApk} from '../services/atualizacaoService';
import styles from './appUpdateModal.styles';

interface AppUpdateModalProps {
  currentVersion: string;
  update: AtualizacaoApp;
  checking: boolean;
  verificationError: string | null;
  onRetry: () => void;
}

interface MetodoAtualizacao {
  label: string;
  url: string;
}

/**
 * Exibe uma atualização obrigatória sem permitir dispensa pelo toque externo
 * ou botão voltar. Abrir o instalador não remove o bloqueio do aplicativo.
 */
export default function AppUpdateModal({
  currentVersion,
  update,
  checking,
  verificationError,
  onRetry,
}: AppUpdateModalProps): React.JSX.Element {
  const theme = useAppTheme();
  const [showMethods, setShowMethods] = useState(false);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  const methods = useMemo<MetodoAtualizacao[]>(() => {
    const availableMethods: MetodoAtualizacao[] = [];
    const apkUrl = Platform.OS === 'android' ? obterUrlApk(update.appApk) : null;

    if (apkUrl) availableMethods.push({label: 'Baixar APK', url: apkUrl});
    if (update.appUrl?.trim()) availableMethods.push({label: 'Abrir link', url: update.appUrl.trim()});

    return availableMethods;
  }, [update.appApk, update.appUrl]);

  useEffect(() => {
    setShowMethods(false);
    setOpeningUrl(null);
  }, [update.versao]);

  const handleOpenUrl = async (url: string): Promise<void> => {
    setOpeningUrl(url);
    const opened = await abrirUrlAtualizacao(url);
    setOpeningUrl(null);

    if (!opened) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível abrir a atualização',
        text2: 'Verifique o link configurado no Strapi e tente novamente.',
      });
      return;
    }

  };

  const handleUpdate = (): void => {
    if (methods.length === 0) {
      onRetry();
      return;
    }

    if (methods.length === 1) {
      void handleOpenUrl(methods[0].url);
      return;
    }

    setShowMethods(true);
  };

  return (
    <Portal>
      <Dialog
        visible
        dismissable={false}
        dismissableBackButton={false}
        style={styles.dialog}
      >
        <Dialog.Title>
          {showMethods
            ? 'Escolha uma opção'
            : 'Atualização obrigatória'}
        </Dialog.Title>

        <Dialog.Content>
          {showMethods ? (
            <View style={styles.methods}>
              {methods.map(method => (
                <Button key={method.url} mode="outlined" loading={openingUrl === method.url} disabled={Boolean(openingUrl)} contentStyle={styles.methodButton} onPress={() => void handleOpenUrl(method.url)}>
                  {method.label}
                </Button>
              ))}
            </View>
          ) : (
            <>
              <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
                Para continuar usando o aplicativo, instale a versão {update.versao}.
              </Text>
              <Text style={[styles.currentVersion, {color: theme.colors.onSurfaceVariant}]}>
                Versão instalada: {currentVersion}
              </Text>
              {methods.length === 0 ? (
                <Text
                  style={[
                    styles.errorText,
                    {color: theme.colors.error},
                  ]}
                >
                  {verificationError
                    ?? 'O link da atualização ainda não está disponível. Tente novamente.'}
                </Text>
              ) : null}
            </>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          {showMethods ? (
            <Button disabled={Boolean(openingUrl)} onPress={() => setShowMethods(false)}>Voltar</Button>
          ) : null}
          {!showMethods && methods.length > 0 ? (
            <Button loading={Boolean(openingUrl)} disabled={Boolean(openingUrl)} onPress={handleUpdate}>Atualizar</Button>
          ) : null}
          {!showMethods && methods.length === 0 ? (
            <Button
              loading={checking}
              disabled={checking}
              onPress={onRetry}
            >
              Tentar novamente
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
