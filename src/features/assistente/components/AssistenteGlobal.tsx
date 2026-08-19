import {MaterialIcons} from '@expo/vector-icons';
import React, {memo, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import useAssistenteAdocao from '../adoption/hooks/useAssistenteAdocao';
import {EXEMPLOS_INICIAIS_ASSISTENTE} from '../adoption/useCases/obterSugestaoContextualAssistente';
import useFloatingActionPosition from '../../../shared/hooks/useFloatingActionPosition';
import SugestaoFab from '../../sugestoes/components/SugestaoFab';
import useAssistenteGlobal from '../hooks/useAssistenteGlobal';
import type {ComandoAssistente} from '../models/ComandoAssistente';
import styles from './assistenteGlobal.styles';

const ASSISTENTE_POSITION_KEY = '@drogal:assistente-fab-position';

interface AcaoRapida {
  texto: string;
  comando: ComandoAssistente;
  icone: keyof typeof MaterialIcons.glyphMap;
}

const ACOES_RAPIDAS: readonly AcaoRapida[] = [
  {
    texto: 'O que você faz?',
    comando: {dominio: 'sistema', acao: 'ajuda'},
    icone: 'help-outline',
  },
  {
    texto: 'Enviar sugestão',
    comando: {dominio: 'sugestoes', acao: 'abrir'},
    icone: 'feedback',
  },
  {
    texto: 'Restaurante próximo',
    comando: {
      dominio: 'pontos',
      acao: 'mostrar_proximos',
      categoria: 'Restaurante',
      quantidade: 1,
    },
    icone: 'restaurant',
  },
  {
    texto: 'Posto próximo',
    comando: {
      dominio: 'pontos',
      acao: 'mostrar_proximos',
      categoria: 'Posto de Combustível',
      quantidade: 1,
    },
    icone: 'local-gas-station',
  },
  {
    texto: 'Montar rota',
    comando: {dominio: 'navegacao', acao: 'abrir', destino: 'inicio'},
    icone: 'route',
  },
  {
    texto: 'Mapa de filiais',
    comando: {
      dominio: 'navegacao',
      acao: 'abrir',
      destino: 'mapa_filiais',
    },
    icone: 'map',
  },
  {
    texto: 'Total de filiais',
    comando: {dominio: 'filiais', acao: 'contar_total'},
    icone: 'storefront',
  },
  {
    texto: 'Cidade com mais filiais',
    comando: {
      dominio: 'filiais',
      acao: 'ranking',
      agrupamento: 'cidade',
      ordem: 'mais',
      quantidade: 1,
    },
    icone: 'location-city',
  },
  {
    texto: 'Histórico de hoje',
    comando: {
      dominio: 'historico',
      acao: 'resumir',
      periodo: 'hoje',
    },
    icone: 'history',
  },
  {
    texto: 'Última visita',
    comando: {dominio: 'historico', acao: 'consultar_ultimo'},
    icone: 'schedule',
  },
  {
    texto: 'Listar departamentos',
    comando: {dominio: 'contatos', acao: 'listar_departamentos'},
    icone: 'groups',
  },
  {
    texto: 'Abrir contatos',
    comando: {
      dominio: 'navegacao',
      acao: 'abrir',
      destino: 'contatos',
    },
    icone: 'contact-phone',
  }
];

interface AcaoRapidaButtonProps extends AcaoRapida {
  disabled: boolean;
  onPress: (texto: string, comando: ComandoAssistente) => void;
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
      onPress={() => onPress(texto, comando)}
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

const SugestaoDinamicaButton = memo(function SugestaoDinamicaButton({
  texto,
  disabled,
  onPress,
}: {
  texto: string;
  disabled: boolean;
  onPress: (texto: string) => void;
}): React.JSX.Element {
  const {colors} = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={texto}
      disabled={disabled}
      onPress={() => onPress(texto)}
      style={[
        styles.chip,
        {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <Text style={[styles.dynamicChipText, {color: colors.onSurface}]}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
});

/**
 * Mantém um único ponto de entrada do assistente sobre toda a navegação
 * autenticada. A interpretação e as regras ficam no hook; este componente
 * cuida apenas da experiência visual e de acessibilidade.
 */
interface AssistenteGlobalProps {
  iaHabilitada: boolean;
  orquestradorHabilitado: boolean;
  sugestoesHabilitadas: boolean;
}

export default function AssistenteGlobal({
  iaHabilitada,
  orquestradorHabilitado,
  sugestoesHabilitadas,
}: AssistenteGlobalProps): React.JSX.Element {
  const {colors} = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const [textoDigitado, setTextoDigitado] = useState('');
  const assistente = useAssistenteGlobal({
    iaHabilitada,
    orquestradorHabilitado,
  });
  const {panHandlers, transform} = useFloatingActionPosition(
    ASSISTENTE_POSITION_KEY,
  );
  const ocupado = assistente.ativo || assistente.processando;
  const adocao = useAssistenteAdocao({
    habilitada: sugestoesHabilitadas,
    assistenteVisivel: assistente.visivel,
    tecladoVisivel,
  });

  const abrirAssistente = (textoInicial?: string): void => {
    if (textoInicial) setTextoDigitado(textoInicial);
    adocao.registrarAbertura();
    assistente.abrir();
  };

  const enviarTexto = (): void => {
    const pergunta = textoDigitado.trim();
    if (!pergunta || ocupado) return;
    assistente.enviarTexto(pergunta);
    setTextoDigitado('');
    Keyboard.dismiss();
  };

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
        <Animated.View
          {...panHandlers}
          style={[styles.fabContainer, {transform}]}
          pointerEvents="box-none"
        >
          {adocao.dica ? (
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={adocao.dica.mensagem}
              onPress={() => {
                const pergunta = adocao.selecionarDica();
                if (pergunta !== null) abrirAssistente(pergunta || undefined);
              }}
              style={[
                styles.contextHint,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <Text style={[styles.contextHintText, {color: colors.onSurface}]}>
                {adocao.dica.mensagem}
              </Text>
              <Text style={[styles.contextHintAction, {color: colors.primary}]}>
                Toque para experimentar
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Abrir assistente do aplicativo"
            accessibilityHint="Abre opções de ajuda e comando de voz"
            onPress={() => abrirAssistente()}
            onLongPress={() => {
              adocao.registrarAbertura();
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
        </Animated.View>
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

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}
          >
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
              {adocao.apresentacaoVisivel ? (
                <View style={[styles.onboardingCard, {backgroundColor: colors.primarySoft, borderColor: colors.outline}]}>
                  <Text style={[styles.onboardingTitle, {color: colors.onSurface}]}>
                    Faça perguntas sobre filiais, contatos, pontos e suas rotas.
                  </Text>
                  <Text style={[styles.onboardingDescription, {color: colors.onSurfaceVariant}]}>
                    Você pode digitar ou tocar no microfone quando quiser falar.
                  </Text>
                  {EXEMPLOS_INICIAIS_ASSISTENTE.map(exemplo => (
                    <TouchableOpacity
                      key={exemplo}
                      accessibilityRole="button"
                      onPress={() => setTextoDigitado(adocao.selecionarExemplo(exemplo))}
                      style={[styles.onboardingExample, {borderColor: colors.outline}]}
                    >
                      <Text style={[styles.onboardingExampleText, {color: colors.onSurface}]}>
                        {exemplo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity accessibilityRole="button" onPress={adocao.fecharApresentacao} style={styles.onboardingClose}>
                    <Text style={[styles.onboardingCloseText, {color: colors.primary}]}>Entendi</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

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
                    <ActivityIndicator
                      style={styles.responseLoader}
                      size="small"
                      color={colors.primary}
                    />
                  ) : null}
                  <Text style={[styles.responseText, {color: colors.onSurface}]}>
                    {assistente.mensagem}
                  </Text>
                </View>
              </View>

              {!assistente.respostasFaladasAtivas && assistente.mensagem ? (
                <TouchableOpacity accessibilityRole="button" onPress={() => { void assistente.ouvirResposta(); }} style={styles.listenButton}>
                  <Text style={[styles.listenButtonText, {color: colors.primary}]}>Ouvir resposta</Text>
                </TouchableOpacity>
              ) : null}

              <View style={[styles.inputRow, {backgroundColor: colors.surfaceVariant, borderColor: colors.outline}]}>
                <TextInput
                  accessibilityLabel="Digite sua pergunta para a assistente"
                  value={textoDigitado}
                  onChangeText={setTextoDigitado}
                  onSubmitEditing={enviarTexto}
                  editable={!ocupado}
                  placeholder="Ex.: qual o telefone da filial 25?"
                  placeholderTextColor={colors.onSurfaceVariant}
                  returnKeyType="send"
                  blurOnSubmit
                  style={[styles.textInput, {color: colors.onSurface}]}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={!textoDigitado.trim() || ocupado}
                  onPress={enviarTexto}
                  style={[styles.sendButton, {backgroundColor: colors.actionBackground, opacity: !textoDigitado.trim() || ocupado ? 0.5 : 1}]}
                >
                  <Text style={[styles.sendButtonText, {color: colors.actionForeground}]}>Enviar</Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.sectionTitle, {color: colors.onSurface}]}
              >
                Sugestões
              </Text>
              <ScrollView
                horizontal
                style={styles.chipsScroll}
                contentContainerStyle={styles.chips}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {assistente.sugestoesDinamicas.map(sugestao => (
                  <SugestaoDinamicaButton
                    key={`dinamica-${sugestao}`}
                    texto={sugestao}
                    disabled={ocupado}
                    onPress={assistente.executarSugestao}
                  />
                ))}
                {ACOES_RAPIDAS.map(acao => (
                  <AcaoRapidaButton
                    key={acao.texto}
                    {...acao}
                    disabled={ocupado}
                    onPress={assistente.executarAcaoRapida}
                  />
                ))}
              </ScrollView>

              <View
                style={[
                  styles.voicePreference,
                  {borderColor: colors.outline},
                ]}
              >
                <View style={styles.voicePreferenceText}>
                  <Text
                    style={[
                      styles.voicePreferenceTitle,
                      {color: colors.onSurface},
                    ]}
                  >
                    Responder em voz
                  </Text>

                </View>
                <Switch
                  accessibilityLabel="Ativar respostas faladas do assistente"
                  value={assistente.respostasFaladasAtivas}
                  disabled={ocupado}
                  onValueChange={ativas => {
                    void assistente.alterarRespostasFaladas(ativas);
                  }}
                  trackColor={{
                    false: colors.surfaceVariant,
                    true: colors.primarySoft,
                  }}
                  thumbColor={
                    assistente.respostasFaladasAtivas
                      ? colors.primary
                      : colors.onSurfaceVariant
                  }
                />
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
          </KeyboardAvoidingView>
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
