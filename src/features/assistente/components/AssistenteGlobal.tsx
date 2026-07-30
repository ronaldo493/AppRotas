import {MaterialIcons} from '@expo/vector-icons';
import React, {memo, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import SugestaoFab from '../../sugestoes/components/SugestaoFab';
import useAssistenteGlobal from '../hooks/useAssistenteGlobal';
import styles from './assistenteGlobal.styles';

interface AcaoRapida {
  texto: string;
  comando: string;
  icone: keyof typeof MaterialIcons.glyphMap;
}

const ACOES_RAPIDAS: readonly AcaoRapida[] = [
  {
    texto: 'O que você faz?',
    comando: 'O que você pode fazer?',
    icone: 'help-outline',
  },
  {
    texto: 'Restaurante próximo',
    comando: 'Mostrar o restaurante mais próximo',
    icone: 'restaurant',
  },
  {
    texto: 'Posto próximo',
    comando: 'Mostrar o posto mais próximo',
    icone: 'local-gas-station',
  },
  {
    texto: 'Meus chamados',
    comando: 'Consultar resumo dos meus chamados',
    icone: 'confirmation-number',
  },
  {
    texto: 'Enviar sugestão',
    comando: 'Abrir sugestão',
    icone: 'feedback',
  },
];

interface AcaoRapidaButtonProps extends AcaoRapida {
  disabled: boolean;
  onPress: (comando: string) => void;
}

const AcaoRapidaButton = memo(function AcaoRapidaButton({
  texto,
  comando,
  icone,
  disabled,
  onPress,
}: AcaoRapidaButtonProps): React.JSX.Element {
  const {colors} = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={texto}
      disabled={disabled}
      onPress={() => onPress(comando)}
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceVariant,
          borderColor: colors.outline,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <MaterialIcons name={icone} size={17} color={colors.iconDefault} />
      <Text style={[styles.chipText, {color: colors.onSurface}]}>{texto}</Text>
    </TouchableOpacity>
  );
});

/**
 * Mantém um único ponto de entrada do assistente sobre toda a navegação
 * autenticada. A interpretação e as regras ficam no hook; este componente
 * cuida apenas da experiência visual e de acessibilidade.
 */
export default function AssistenteGlobal(): React.JSX.Element {
  const {colors} = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const assistente = useAssistenteGlobal();
  const ocupado =
    assistente.ativo || assistente.processando || assistente.salvandoHistorico;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTecladoVisivel(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setTecladoVisivel(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const status = assistente.ouvindo
    ? 'Ouvindo você…'
    : assistente.processando
      ? 'Entendendo o pedido…'
      : assistente.respostasFaladasAtivas
        ? 'Ajuda disponível em todo o aplicativo'
        : 'Respostas faladas desativadas';

  return (
    <>
      {!assistente.visivel && !tecladoVisivel ? (
        <View style={styles.fabContainer} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Abrir assistente do aplicativo"
            accessibilityHint="Abre opções de ajuda e comando de voz"
            onPress={assistente.abrir}
            onLongPress={() => {
              void assistente.ouvir();
            }}
            style={[
              styles.fab,
              {
                backgroundColor: colors.primary,
                borderColor: colors.outline,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <MaterialIcons name="graphic-eq" size={26} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={assistente.visivel && !assistente.sugestaoVisivel}
        transparent
        statusBarTranslucent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={assistente.fechar}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar assistente"
            style={styles.backdrop}
            onPress={assistente.fechar}
          />

          <View
            style={[
              styles.panel,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                {backgroundColor: colors.onSurfaceVariant},
              ]}
            />

            <View style={styles.header}>
              <View
                style={[
                  styles.headerIcon,
                  {backgroundColor: colors.primarySoft},
                ]}
              >
                <MaterialIcons
                  name="graphic-eq"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View style={styles.headerText}>
                <Text style={[styles.title, {color: colors.onSurface}]}>
                  Assistente Drogal
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    {color: colors.onSurfaceVariant},
                  ]}
                >
                  {status}
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar assistente"
                onPress={assistente.fechar}
                style={styles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={23}
                  color={colors.iconDefault}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {assistente.transcricao ? (
                <>
                  <Text
                    style={[
                      styles.heardLabel,
                      {color: colors.onSurfaceVariant},
                    ]}
                  >
                    Você disse
                  </Text>
                  <Text
                    style={[
                      styles.transcript,
                      {color: colors.onSurfaceVariant},
                    ]}
                  >
                    “{assistente.transcricao}”
                  </Text>
                </>
              ) : null}

              <View
                style={[
                  styles.responseCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <View style={styles.responseRow}>
                  {assistente.processando ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons
                      name="assistant"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    style={[
                      styles.responseText,
                      {color: colors.onSurface},
                    ]}
                  >
                    {assistente.mensagem}
                  </Text>
                </View>
              </View>

              {assistente.navegadorVisivel ? (
                <View
                  style={[
                    styles.navigatorCard,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.outline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.navigatorTitle,
                      {color: colors.onSurface},
                    ]}
                  >
                    Onde deseja navegar?
                  </Text>
                  <Text
                    style={[
                      styles.navigatorDescription,
                      {color: colors.onSurfaceVariant},
                    ]}
                  >
                    A ordem atual das filiais será mantida.
                  </Text>

                  <View style={styles.navigatorActions}>
                    <TouchableOpacity
                      disabled={ocupado}
                      onPress={() => {
                        void assistente.abrirNavegador('google');
                      }}
                      style={[
                        styles.navigatorButton,
                        {backgroundColor: colors.actionBackground},
                      ]}
                    >
                      <MaterialIcons
                        name="map"
                        size={18}
                        color={colors.actionForeground}
                      />
                      <Text
                        style={[
                          styles.navigatorButtonText,
                          {color: colors.actionForeground},
                        ]}
                      >
                        Google Maps
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={ocupado}
                      onPress={() => {
                        void assistente.abrirNavegador('waze');
                      }}
                      style={[
                        styles.navigatorButton,
                        {backgroundColor: colors.actionBackground},
                      ]}
                    >
                      <MaterialIcons
                        name="navigation"
                        size={18}
                        color={colors.actionForeground}
                      />
                      <Text
                        style={[
                          styles.navigatorButtonText,
                          {color: colors.actionForeground},
                        ]}
                      >
                        Waze
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    disabled={ocupado}
                    onPress={assistente.fecharNavegador}
                    style={styles.cancelNavigator}
                  >
                    <Text
                      style={[
                        styles.cancelNavigatorText,
                        {color: colors.primary},
                      ]}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text
                style={[styles.sectionTitle, {color: colors.onSurface}]}
              >
                Atalhos
              </Text>
              <View style={styles.chips}>
                {ACOES_RAPIDAS.map(acao => (
                  <AcaoRapidaButton
                    key={acao.comando}
                    {...acao}
                    disabled={ocupado}
                    onPress={assistente.executarSugestao}
                  />
                ))}
              </View>

              <View style={styles.microphoneArea}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityLabel={
                    assistente.ouvindo
                      ? 'Parar de ouvir'
                      : 'Falar com o assistente'
                  }
                  disabled={assistente.processando}
                  onPress={() => {
                    void assistente.ouvir();
                  }}
                  style={[
                    styles.microphoneButton,
                    {
                      backgroundColor: assistente.ouvindo
                        ? colors.primary
                        : colors.actionBackground,
                      shadowColor: colors.shadow,
                      opacity: assistente.processando ? 0.6 : 1,
                    },
                  ]}
                >
                  {assistente.processando ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.actionForeground}
                    />
                  ) : (
                    <MaterialIcons
                      name={assistente.ouvindo ? 'stop' : 'mic'}
                      size={29}
                      color={
                        assistente.ouvindo
                          ? colors.onPrimary
                          : colors.actionForeground
                      }
                    />
                  )}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.microphoneHint,
                    {color: colors.onSurfaceVariant},
                  ]}
                >
                  {assistente.ouvindo
                    ? 'Fale normalmente. Toque para encerrar.'
                    : 'Toque e diga o que precisa'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SugestaoFab
        showButton={false}
        visible={assistente.sugestaoVisivel}
        onVisibleChange={visible => {
          if (!visible) assistente.fecharSugestao();
        }}
      />
    </>
  );
}
