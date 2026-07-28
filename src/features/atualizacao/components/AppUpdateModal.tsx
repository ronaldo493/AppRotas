import React, {useEffect, useMemo, useState} from 'react';
import {Platform, Text, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {AtualizacaoApp} from '../models/AtualizacaoApp';
import {abrirUrlAtualizacao, obterUrlApk} from '../services/atualizacaoService';
import styles from './appUpdateModal.styles';

interface AppUpdateModalProps {
  visible: boolean;
  currentVersion: string;
  update: AtualizacaoApp;
  onDismiss: () => void;
}

interface MetodoAtualizacao {
  label: string;
  url: string;
}

export default function AppUpdateModal({
  visible,
  currentVersion,
  update,
  onDismiss,
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
    if (!visible) return;

    setShowMethods(false);
    setOpeningUrl(null);
  }, [update.versao, visible]);

  const handleDismiss = (): void => {
    if (!openingUrl) onDismiss();
  };

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

    onDismiss();
  };

  const handleUpdate = (): void => {
    if (methods.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Atualização indisponível',
        text2: 'Nenhum APK ou link externo foi configurado.',
      });
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
      <Dialog visible={visible} dismissable={!openingUrl} dismissableBackButton={!openingUrl} style={styles.dialog} onDismiss={handleDismiss}>
        <Dialog.Title>{showMethods ? 'Escolha uma opção' : 'Atualização disponível'}</Dialog.Title>

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
                A versão {update.versao} está disponível para download.
              </Text>
              <Text style={[styles.currentVersion, {color: theme.colors.onSurfaceVariant}]}>
                Versão instalada: {currentVersion}
              </Text>
            </>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          {showMethods ? (
            <Button disabled={Boolean(openingUrl)} onPress={() => setShowMethods(false)}>Voltar</Button>
          ) : (
            <Button disabled={Boolean(openingUrl)} onPress={handleDismiss}>Agora não</Button>
          )}
          {!showMethods ? (
            <Button loading={Boolean(openingUrl)} disabled={Boolean(openingUrl)} onPress={handleUpdate}>Atualizar</Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
